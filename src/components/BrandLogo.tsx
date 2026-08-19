import Image from "next/image";

/**
 * HarmeLearn brand mark — the circular book/leaf logo.
 * Use this everywhere instead of the old letter "H" placeholder.
 */
export default function BrandLogo({
  size = 44,
  className = "",
  rounded = true,
}: {
  size?: number;
  className?: string;
  rounded?: boolean;
}) {
  return (
    <Image
      src="/icons/icon-512.png"
      alt="HarmeLearn Academy"
      width={size}
      height={size}
      priority
      className={`${rounded ? "rounded-full" : "rounded-xl"} object-cover shadow-sm ${className}`}
    />
  );
}
