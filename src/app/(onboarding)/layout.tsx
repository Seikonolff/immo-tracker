import { Toaster } from '@/components/ui/sonner'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">immo-tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">Configuration de votre compte</p>
        </div>
        {children}
      </div>
      <Toaster />
    </div>
  )
}
