// Unico usuario con acceso al sistema.
export const ALLOWED_EMAIL = "beriguetemisael@gmail.com"

export type CurrencyCode = "DOP" | "USD" | "EUR" | "MXN" | "COP" | "ARS" | "CAD"

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
  CAD: { label: "Dólar canadiense", symbol: "CA$", locale: "en-CA" },
}

export function formatMoney(amount: number, currency: string = "DOP") {
  const c = CURRENCIES[currency as CurrencyCode] ?? CURRENCIES.DOP
  const formatted = new Intl.NumberFormat(c.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
  return `${c.symbol} ${formatted}`
}

export const LABEL_MAP: Record<string, string> = {
  // Presets de Fechas
  este_mes: "Este Mes",
  "30_dias": "Últimos 30 días",
  este_ano: "Este Año",
  todo: "Todo el Historial",
  custom: "Rango Personalizado",

  // Tipos de Cuenta Bancaria
  cuenta_ahorro: "Cuenta de Ahorros",
  cuenta_corriente: "Cuenta Corriente",
  tarjeta_credito: "Tarjeta de Crédito",
  efectivo: "Efectivo / Caja",
  inversion: "Inversión / Fondo",
  otro: "Otra Cuenta",

  // Categorías de Transacción
  entrada: "Entrada / Ingreso",
  ganancia_negocio: "Ganancia de Negocio",
  gasto: "Gasto General",
  gasto_hormiga: "Gastos Hormiga",
  servicio: "Servicios y Facturas",
  comida: "Comida y Restaurantes",
  transporte: "Transporte y Vehículo",
  transferencia: "Transferencia Interna",
  general: "General",

  // Deudas
  deuda: "Deuda Personal",
  pasivo: "Pasivo Financiero",

  // Frecuencias
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
  anual: "Anual",
}

export function formatLabel(key?: string | null): string {
  if (!key) return ""
  const cleanKey = String(key).trim().toLowerCase()
  if (LABEL_MAP[cleanKey]) {
    return LABEL_MAP[cleanKey]
  }
  return cleanKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
