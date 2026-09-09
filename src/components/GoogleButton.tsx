import { useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export function GoogleButton() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error(t("common.error"));
      return;
    }
    if (result.redirected) return;
    window.location.href = "/dashboard";
  }

  return (
    <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void onClick()}>
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5a4.7 4.7 0 0 1-2 3.1l3.2 2.5c1.9-1.7 3-4.3 3-7.4 0-.7-.1-1.4-.2-2z"
        />
        <path
          fill="#34A853"
          d="M6.6 14.3 5.9 15l-2.5 2A9 9 0 0 0 12 21c2.4 0 4.5-.8 6-2.2l-3.2-2.5c-.8.5-1.8.9-2.8.9-2.3 0-4.2-1.5-4.9-3.6z"
        />
        <path fill="#FBBC05" d="M3.4 7A9 9 0 0 0 3.4 17l3.2-2.5a5.4 5.4 0 0 1 0-3.4z" />
        <path
          fill="#4285F4"
          d="M12 6.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 3.4 7l3.2 2.5C7.3 7.9 9.4 6.6 12 6.6z"
        />
      </svg>
      <span className="ms-2">{t("auth.google")}</span>
    </Button>
  );
}
