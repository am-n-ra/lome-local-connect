import logo from "@/assets/omni-logo.png";

/** Official Omni mark: the supplied eye inside a location pin. */
export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="Omni logo"
      className={`${className} shrink-0 rounded-[22%] object-cover shadow-sm`}
      loading="eager"
      decoding="async"
    />
  );
}
