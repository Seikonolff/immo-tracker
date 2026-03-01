'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Users, UserCircle, Building2, Loader2, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { saveProfile, createTeamAndJoin, joinTeamByCode } from '@/lib/actions/onboarding'

interface OnboardingFlowProps {
  initialName: string
}

type TeamMode = 'create' | 'join'

const STEPS = [
  { id: 1, label: 'Profil', icon: UserCircle },
  { id: 2, label: 'Équipe', icon: Building2 },
  { id: 3, label: 'Inviter', icon: Users },
]

export function OnboardingFlow({ initialName }: OnboardingFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState(initialName)

  const [teamMode, setTeamMode] = useState<TeamMode>('create')
  const [teamName, setTeamName] = useState('')
  const [inviteInput, setInviteInput] = useState('')

  const [teamInviteCode, setTeamInviteCode] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleStep1() {
    if (!fullName.trim()) return
    setLoading(true)
    const result = await saveProfile(fullName)
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    setStep(2)
  }

  async function handleStep2() {
    setLoading(true)
    const result = teamMode === 'create'
      ? await createTeamAndJoin(teamName)
      : await joinTeamByCode(inviteInput)
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    setTeamInviteCode(result.inviteCode ?? '')
    setStep(3)
  }

  function handleCopy() {
    navigator.clipboard.writeText(teamInviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleFinish() {
    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">

      {/* Step indicators */}
      <div className="flex items-center justify-center">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  step > s.id
                    ? 'border-primary bg-primary text-primary-foreground scale-110'
                    : step === s.id
                    ? 'border-primary bg-background text-primary shadow-sm shadow-primary/20'
                    : 'border-muted-foreground/30 bg-background text-muted-foreground/40'
                }`}
              >
                {step > s.id ? (
                  <Check className="h-4 w-4 animate-in zoom-in-50 duration-200" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-300 ${
                  step >= s.id ? 'text-foreground' : 'text-muted-foreground/40'
                }`}
              >
                {s.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div className="relative mb-5 h-px w-16 bg-muted-foreground/20 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-primary transition-all duration-500 ease-out"
                  style={{ width: step > s.id ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step content — key forces remount → triggers enter animation on each step */}
      <div key={step} className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300">

        {/* Step 1 — Profile */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-bold">Comment vous appelez-vous ?</h2>
              <p className="text-sm text-muted-foreground">
                Ce nom sera visible par les membres de votre équipe.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
                placeholder="Jean Dupont"
                autoFocus
              />
            </div>
            <Button
              className="w-full"
              onClick={handleStep1}
              disabled={!fullName.trim() || loading}
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : 'Continuer →'}
            </Button>
          </div>
        )}

        {/* Step 2 — Team */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-bold">Votre équipe</h2>
              <p className="text-sm text-muted-foreground">
                Créez une nouvelle équipe ou rejoignez une équipe existante.
              </p>
            </div>

            <div className="flex rounded-lg border p-1 gap-1">
              {(['create', 'join'] as TeamMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTeamMode(mode)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    teamMode === mode
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode === 'create' ? 'Créer une équipe' : 'Rejoindre'}
                </button>
              ))}
            </div>

            <div key={teamMode} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 space-y-2">
              {teamMode === 'create' ? (
                <>
                  <Label htmlFor="teamName">Nom de l'équipe</Label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStep2()}
                    placeholder="Ex : Recherche appart Paris 2024"
                    autoFocus
                  />
                </>
              ) : (
                <>
                  <Label htmlFor="inviteCode">Code d'invitation</Label>
                  <Input
                    id="inviteCode"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStep2()}
                    placeholder="Collez le code reçu ici"
                    autoFocus
                  />
                </>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleStep2}
              disabled={loading || (teamMode === 'create' ? !teamName.trim() : !inviteInput.trim())}
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validation...</> : 'Continuer →'}
            </Button>
          </div>
        )}

        {/* Step 3 — Invite */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 animate-in zoom-in-50 duration-500">
                  <PartyPopper className="h-7 w-7 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">C'est parti !</h2>
                <p className="text-sm text-muted-foreground">
                  Partagez ce code avec les personnes qui font partie de votre recherche.
                </p>
              </div>
            </div>

            <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 delay-150">
              <Label>Code d'invitation</Label>
              <div className="flex gap-2">
                <Input value={teamInviteCode} readOnly className="font-mono text-sm tracking-widest" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0 transition-all duration-200"
                >
                  {copied
                    ? <Check className="h-4 w-4 text-green-500 animate-in zoom-in-50 duration-200" />
                    : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Retrouvez et regénérez ce code à tout moment dans les paramètres de l'équipe.
              </p>
            </div>

            <Button
              className="w-full animate-in fade-in-0 duration-500 delay-300"
              onClick={handleFinish}
            >
              Commencer
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
