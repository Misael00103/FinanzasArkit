// Unico usuario con acceso al sistema.
export const ALLOWED_EMAIL = "beriguetemisael@gmail.com"

export type CurrencyCode = "DOP" | "USD" | "EUR" | "MXN" | "COP" | "ARS"

export const CURRENCIES: Record<
  CurrencyCode,
  { label: string; symbol: string; locale: string }
> = {
  DOP: { label: "Peso dominicano", symbol: "RD$", locale: "es-DO" },
  USD: { label: "Dolar estadounidense", symbol: "US$", locale: "en-US" },
  EUR: { label: "Euro", symbol: "\u20AC", locale: "es-ES" },
  MXN: { label: "Peso mexicano", symbol: "MX$", locale: "es-MX" },
  COP: { label: "Peso colombiano", symbol: "COP$", locale: "es-CO" },
  ARS: { label: "Peso argentino", symbol: "AR$", locale: "es-AR" },
}

export function formatMoney(amount: number, currency: string = "DOP") {
  const c = CURRENCIES[currency as CurrencyCode] ?? CURRENCIES.DOP
  const formatted = new Intl.NumberFormat(c.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
  return `${c.symbol} ${formatted}`
}
