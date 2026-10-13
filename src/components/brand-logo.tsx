import Image from "next/image";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/brand/ongsave-logo.svg"
      alt="ONGSave · Prato solidário"
      width={130}
      height={80}
      unoptimized
      className={`brand-logo ${className}`}
    />
  );
}
