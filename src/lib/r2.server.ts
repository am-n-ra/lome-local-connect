/**
 * Cloudflare R2 access (S3-compatible) — presigned PUT URLs.
 * Credentials are read at call time so the app keeps working before the
 * environment variables are configured (Vercel env).
 */

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

export function r2Config(): R2Config | null {
  const accountId = process.env["R2_ACCOUNT_ID"];
  const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];
  const bucket = process.env["R2_BUCKET"];
  const publicUrl = process.env["R2_PUBLIC_URL"];
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return null;
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl: publicUrl.replace(/\/$/, ""),
  };
}

const encoder = new TextEncoder();

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function encodeKey(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function signingKeyFor(config: R2Config, dateStamp: string): Promise<ArrayBuffer> {
  let key = await hmac(encoder.encode(`AWS4${config.secretAccessKey}`), dateStamp);
  key = await hmac(key, "auto");
  key = await hmac(key, "s3");
  return hmac(key, "aws4_request");
}

function stamps() {
  const amzDate = `${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

/**
 * Builds a presigned S3v4 PUT URL valid for `expiresIn` seconds.
 * The browser uploads the file straight to R2 with that URL.
 */
export async function presignPut(
  config: R2Config,
  key: string,
  contentType: string,
  expiresIn = 600,
): Promise<string> {
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const { amzDate, dateStamp } = stamps();
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const canonicalUri = `/${config.bucket}/${encodeKey(key)}`;

  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "content-type;host",
  });
  params.sort();

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    params.toString(),
    `content-type:${contentType}\nhost:${host}\n`,
    "content-type;host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = hex(await hmac(await signingKeyFor(config, dateStamp), stringToSign));
  return `https://${host}${canonicalUri}?${params.toString()}&X-Amz-Signature=${signature}`;
}

/** Deletes an object from the bucket (best effort). */
export async function deleteObject(config: R2Config, key: string): Promise<void> {
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const { amzDate, dateStamp } = stamps();
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const canonicalUri = `/${config.bucket}/${encodeKey(key)}`;
  const payloadHash = await sha256Hex("");

  const canonicalRequest = [
    "DELETE",
    canonicalUri,
    "",
    `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`,
    "host;x-amz-content-sha256;x-amz-date",
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = hex(await hmac(await signingKeyFor(config, dateStamp), stringToSign));

  await fetch(`https://${host}${canonicalUri}`, {
    method: "DELETE",
    headers: {
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`,
    },
  });
}

export function publicUrlFor(config: R2Config, key: string): string {
  return `${config.publicUrl}/${encodeKey(key)}`;
}
