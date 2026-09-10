import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/i18n";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const label = theme === "dark" ? t("theme.light") : t("theme.dark");

  if (compact) {
    return (
      <Button variant="ghost" size="icon" aria-label={label} onClick={toggle}>
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>
    );
  }

  return (
    <Button variant="ghost" className="w-full justify-start" onClick={toggle}>
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="ms-2">{label}</span>
    </Button>
  );
}
