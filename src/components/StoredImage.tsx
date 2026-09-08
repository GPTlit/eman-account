import { useEffect, useState } from "react";
import { signedUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function useSignedUrl(ref: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setUrl(null);
    if (!ref) return;
    void signedUrl(ref).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [ref]);
  return url;
}

export function StoredImage({
  path,
  alt,
  className,
  fallback,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const url = useSignedUrl(path);
  if (!url)
    return (
      <div className={cn("flex items-center justify-center bg-surface-2 text-muted-foreground", className)}>
        {fallback}
      </div>
    );
  return <img src={url} alt={alt} className={cn("object-cover", className)} loading="lazy" />;
}
