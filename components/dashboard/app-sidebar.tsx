"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  Landmark,
  CreditCard,
  ArrowLeftRight,
  CalendarClock,
  Target,
  Sparkles,
  Menu,
  X,
  Wallet,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type UserProfile } from "@/lib/finance"
import { cn } from "@/lib/utils"

export type TabValue =
  | "resumen"
  | "cuentas"
  | "deudas"
  | "movimientos"
  | "fijos"
  | "metas"
  | "asistente"

type SidebarProps = {
  activeTab: TabValue
  onSelectTab: (tab: TabValue) => void
  userProfile: UserProfile
  counts: {
    accountsCount: number
    debtsCount: number
    transactionsCount: number
    goalsCount: number
  }
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const SIDEBAR_ITEMS: {
  value: TabValue
  label: string
  icon: any
  badgeKey?: keyof SidebarProps["counts"]
  badgeColor?: string
}[] = [
  { value: "resumen", label: "Resumen & Métricas", icon: LayoutDashboard },
  { value: "cuentas", label: "Cuentas Bancarias", icon: Landmark, badgeKey: "accountsCount", badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  { value: "deudas", label: "Deudas & Pasivos", icon: CreditCard, badgeKey: "debtsCount", badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  { value: "movimientos", label: "Historial Movimientos", icon: ArrowLeftRight, badgeKey: "transactionsCount", badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { value: "fijos", label: "Movimientos Fijos", icon: CalendarClock },
  { value: "metas", label: "Metas de Ahorro", icon: Target, badgeKey: "goalsCount", badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
  { value: "asistente", label: "Asistente AI Gemini", icon: Sparkles },
]

export function AppSidebar({
  activeTab,
  onSelectTab,
  userProfile,
  counts,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSelect = (tab: TabValue) => {
    onSelectTab(tab)
    setMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Trigger Button */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="h-10 w-10 rounded-xl bg-card/90 border-border/80 shadow-md backdrop-blur-md"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 bg-card/95 border-r border-border/60 shadow-xl backdrop-blur-xl flex flex-col transition-all duration-300 md:static md:z-auto shrink-0",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "md:w-16" : "md:w-64"
        )}
      >
        {/* Brand / Logo Header */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 border-b border-border/60 transition-all",
            isCollapsed ? "justify-center px-2" : "justify-between"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md font-extrabold text-lg">
              <Wallet className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="font-display font-extrabold text-base tracking-tight text-foreground truncate">
                  Finanzas Arkit
                </h1>
                <p className="text-[11px] text-muted-foreground truncate font-medium">
                  Control de Gastos
                </p>
              </div>
            )}
          </div>

          {/* Desktop Hide/Collapse Button */}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-lg"
              title={isCollapsed ? "Expandir Menú" : "Esconder Menú"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 no-scrollbar">
          {!isCollapsed && (
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Navegación Principal
            </p>
          )}
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.value
            const badgeValue = item.badgeKey ? counts[item.badgeKey] : null

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleSelect(item.value)}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group text-left relative",
                  isCollapsed ? "justify-center px-0" : "justify-between px-3.5",
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <div className={cn("flex items-center gap-3 min-w-0", isCollapsed && "justify-center")}>
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && badgeValue !== null && badgeValue !== undefined && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-mono text-[10px] px-1.5 py-0.2 shrink-0 border",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                        : item.badgeColor
                    )}
                  >
                    {badgeValue}
                  </Badge>
                )}

                {/* Dot badge when collapsed */}
                {isCollapsed && badgeValue !== null && badgeValue !== undefined && badgeValue > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                )}
              </button>
            )
          })}
        </div>

        {/* User Profile Footer */}
        <div className={cn("p-2.5 border-t border-border/60 bg-muted/20", isCollapsed && "px-1.5")}>
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl bg-card border border-border/50 shadow-xs",
              isCollapsed && "justify-center p-1.5"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
              {userProfile.name.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">
                  {userProfile.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {userProfile.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

