import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries, LOCALES, type Locale, type TranslationKey } from "./translations";

const STORAGE_KEY = "eman.locale";

type I18nValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "ar" || stored === "en" || stored === "fr") setLocaleState(stored);
  }, []);

  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let value = dictionaries[locale][key] ?? dictionaries.en[key] ?? String(key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) value = value.replaceAll(`{${k}}`, String(v));
      }
      return value;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, dir, setLocale, t }), [locale, dir, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export { LOCALES };
export type { Locale, TranslationKey };
