import logo from "@/assets/omniview-logo.png";

/** Official OmniView mark (glass pin + eye). */
export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="Logo OmniView"
      className={`${className} shrink-0 rounded-[22%] object-cover shadow-sm`}
      loading="eager"
      decoding="async"
    />
  );
}
