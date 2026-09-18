import logo from "@/assets/aman-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="EMAN"
      className={cn("size-9 rounded-xl object-cover", className)}
      loading="eager"
    />
  );
}
