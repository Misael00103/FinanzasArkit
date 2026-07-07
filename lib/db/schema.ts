import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  numeric,
  integer,
  date,
} from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- App tables ------------------------------------------------------------
// Los montos usan numeric(14,2); Drizzle los expone como string, por eso
// las server actions convierten con Number() al leer.

// Preferencias del usuario (moneda de visualizacion)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull().unique(),
  displayCurrency: text("displayCurrency").notNull().default("DOP"),
  monthlyIncome: numeric("monthlyIncome", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// Deudas y pasivos
export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  creditor: text("creditor"),
  // "deuda" | "pasivo"
  type: text("type").notNull().default("deuda"),
  totalAmount: numeric("totalAmount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  paidAmount: numeric("paidAmount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  interestRate: numeric("interestRate", { precision: 6, scale: 2 })
    .notNull()
    .default("0"),
  minimumPayment: numeric("minimumPayment", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  dueDay: integer("dueDay"),
  currency: text("currency").notNull().default("DOP"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Movimientos: entradas, gastos, gastos hormiga, ganancias de negocio
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  // "income" | "expense"
  type: text("type").notNull(),
  // "entrada" | "ganancia_negocio" | "gasto" | "gasto_hormiga" | ...
  category: text("category").notNull().default("general"),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("DOP"),
  // negocio asociado (para ganancias por negocio)
  business: text("business"),
  isAnt: boolean("isAnt").notNull().default(false),
  occurredAt: timestamp("occurredAt").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Entradas y salidas fijas programadas
export const recurring = pgTable("recurring", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  // "income" | "expense"
  direction: text("direction").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("general"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("DOP"),
  // "semanal" | "quincenal" | "mensual" | "anual"
  frequency: text("frequency").notNull().default("mensual"),
  // dia del mes (1-31)
  dayOfMonth: integer("dayOfMonth"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Metas de ahorro / futuro
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  targetAmount: numeric("targetAmount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  savedAmount: numeric("savedAmount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  currency: text("currency").notNull().default("DOP"),
  targetDate: date("targetDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})
