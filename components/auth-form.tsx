"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, User, Sparkles, Target, TrendingDown } from "lucide-react"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === "sign-up"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || "Misael",
            },
          },
        })
        if (error) throw new Error(error.message || "No se pudo crear la cuenta")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw new Error(error.message || "Credenciales incorrectas")
      }
      router.push("/")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrio un error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-screen flex-row overflow-hidden bg-background">
      {/* LEFT PANEL - BRAND SHOWCASE (Desktop Only) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-zinc-950 p-12 text-zinc-50 lg:flex bg-grid-white">
        {/* Ambient Blur Blobs */}
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-blob-reverse" />

        {/* Top Branding Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 p-1.5 shadow-lg">
            <img
              src="/logo-nuevo-removebg-preview.png"
              alt="Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            FinanzasArkit
          </span>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 my-auto max-w-lg space-y-8">
          <div className="space-y-3">
            <h2 className="font-display text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Toma el control inteligente de tu dinero.
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              Una plataforma premium para gestionar tus deudas, optimizar metas de ahorro, controlar gastos hormiga y recibir asesoría inteligente de IA.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-zinc-900/60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Mapeo y Método de Deudas</h4>
                <p className="mt-1 text-xs text-zinc-400">Visualiza tus pasivos y acelera tus pagos usando los métodos Bola de Nieve o Avalancha.</p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-zinc-900/60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Asesor de Inteligencia Artificial</h4>
                <p className="mt-1 text-xs text-zinc-400">Recibe resúmenes de tus gastos hormiga y consejos de optimización financiera personalizados.</p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-zinc-900/60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Metas de Ahorro</h4>
                <p className="mt-1 text-xs text-zinc-400">Registra tus objetivos y visualiza tu progreso en tiempo real de forma intuitiva.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} FinanzasArkit. Todos los derechos reservados.
        </div>
      </div>

      {/* RIGHT PANEL - AUTH FORM */}
      <div className="relative flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        {/* Glow behind card for mobile */}
        <div className="absolute top-1/4 right-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl lg:hidden" />

        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden bg-secondary/50 p-1 shadow-inner lg:hidden">
              <img
                src="/logo-nuevo-removebg-preview.png"
                alt="Logo"
                className="h-10 w-10 object-contain animate-float"
              />
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
              {isSignUp ? "Crear cuenta" : "Bienvenido"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSignUp
                ? "Regístrate para comenzar a administrar tus finanzas."
                : "Ingresa tus credenciales para acceder a tu panel."}
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card/60 p-6 shadow-xl shadow-foreground/[0.02] backdrop-blur-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre</Label>
                  <div className="relative">
                    <User className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-11 bg-background/50 border-border/60 focus-visible:ring-primary/30"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-9 h-11 bg-background/50 border-border/60 focus-visible:ring-primary/30"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    minLength={8}
                    className="pl-9 h-11 bg-background/50 border-border/60 focus-visible:ring-primary/30"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="h-11 w-full text-sm font-semibold shadow-md transition-all duration-300 hover:brightness-105 active:scale-[0.98]" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? "Crear cuenta" : "Ingresar"}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>
                ¿Ya tienes una cuenta?{" "}
                <Link href="/sign-in" className="font-semibold text-primary hover:underline">
                  Inicia sesión
                </Link>
              </>
            ) : (
              <>
                ¿Primera vez configurando el sistema?{" "}
                <Link href="/sign-up" className="font-semibold text-primary hover:underline">
                  Crear una cuenta
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
