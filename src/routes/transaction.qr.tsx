import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { resolveTransactionQr } from "@/lib/checkout.functions";
import { useServerFn } from "@/lib/useServerFn";

const searchSchema = z.object({ token: z.string().min(4).max(64).optional() });

export const Route = createFileRoute("/transaction/qr")({
  validateSearch: searchSchema,
  component: TransactionQrEntry,
});

function TransactionQrEntry() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { token } = Route.useSearch();
  const resolve = useServerFn(resolveTransactionQr);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !token) return;
    let active = true;
    void resolve({ data: { token } })
      .then((result) => {
        if (!active) return;
        navigate({
          to: result.role === "seller" ? "/vendeur" : "/carte",
          search: { transactionId: result.transactionId },
          replace: true,
        });
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Lien QR indisponible.");
      });
    return () => {
      active = false;
    };
  }, [loading, navigate, resolve, token, user]);

  if (!token) {
    return (
      <QrMessage title="Lien QR incomplet" body="Ce lien ne contient pas de transaction Omni." />
    );
  }

  if (!user) {
    const redirectTo = `/transaction/qr?token=${encodeURIComponent(token)}`;
    return (
      <QrMessage
        title="Connectez-vous pour continuer"
        body="Ce lien QR est account-bound. Connectez-vous avec le compte buyer ou seller autorisé pour retrouver le fil transactionnel."
      >
        <Button asChild>
          <Link to="/auth" search={{ redirectTo }}>
            Se connecter
          </Link>
        </Button>
      </QrMessage>
    );
  }

  if (error) {
    return <QrMessage title="Lien QR indisponible" body={error} />;
  }

  return (
    <QrMessage
      title="Ouverture de votre transaction"
      body="Vérification du lien et retour à la carte Omni…"
    />
  );
}

function QrMessage({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-4 py-10">
      <section className="omni-card w-full max-w-md space-y-4 p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Omni · transaction
        </p>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{body}</p>
        {children}
        <Button asChild variant="outline">
          <Link to="/carte">Retour à la carte</Link>
        </Button>
      </section>
    </main>
  );
}
