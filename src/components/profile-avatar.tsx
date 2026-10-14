"use client";
import Image from "next/image";
import { useState } from "react";

export function ProfileAvatar({
  name,
  url,
  className = "",
}: {
  name: string;
  url?: string | null;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <span className={`avatar profile-avatar ${className}`}>
      {url && failedUrl !== url ? (
        <Image
          src={url}
          alt={`Foto de perfil de ${name}`}
          fill
          unoptimized
          sizes="96px"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
      )}
    </span>
  );
}
