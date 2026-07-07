export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
        .animate-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
      <div className="relative flex flex-col items-center">
        {/* Glow */}
        <div className="absolute -inset-12 rounded-full bg-primary/15 blur-3xl animate-glow" />
        
        {/* Logo */}
        <div className="relative animate-float">
          <img
            src="/logo-nuevo-removebg-preview.png"
            alt="Logo"
            className="h-28 w-28 object-contain"
          />
        </div>

        {/* Loading details */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="font-sans text-xs font-semibold tracking-widest text-muted-foreground uppercase animate-pulse">
            Cargando tus finanzas
          </p>
          <div className="h-1 w-28 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-full bg-primary animate-progress rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
