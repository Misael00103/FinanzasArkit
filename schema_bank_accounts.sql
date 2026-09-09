-- Script SQL para Supabase / PostgreSQL
-- Ejecuta este script en el editor SQL de Supabase (SQL Editor) si la tabla aún no existe.

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "bankName" TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'cuenta_ahorro',
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'DOP',
  "accountNumber" TEXT,
  color TEXT DEFAULT '#3b82f6',
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Si la tabla ya existía, agregar la columna bankName
ALTER TABLE public.bank_accounts 
  ADD COLUMN IF NOT EXISTS "bankName" TEXT;

-- Agregar columna bankAccountId a transactions si no existe
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS "bankAccountId" INTEGER REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para bank_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bank_accounts' AND policyname = 'Allow select for authenticated user'
  ) THEN
    CREATE POLICY "Allow select for authenticated user" ON public.bank_accounts
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bank_accounts' AND policyname = 'Allow insert for authenticated user'
  ) THEN
    CREATE POLICY "Allow insert for authenticated user" ON public.bank_accounts
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bank_accounts' AND policyname = 'Allow update for authenticated user'
  ) THEN
    CREATE POLICY "Allow update for authenticated user" ON public.bank_accounts
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bank_accounts' AND policyname = 'Allow delete for authenticated user'
  ) THEN
    CREATE POLICY "Allow delete for authenticated user" ON public.bank_accounts
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;
