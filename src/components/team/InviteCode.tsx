'use client'

import { useState } from 'react'
import { Check, Copy, RefreshCw } from 'lucide-react'
import { regenerateInviteCode } from '@/lib/actions/team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface InviteCodeProps {
  code: string
}

export function InviteCode({ code: initialCode }: InviteCodeProps) {
  const [code, setCode] = useState(initialCode)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copié dans le presse-papiers')
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    if (!confirm('Êtes-vous sûr de vouloir régénérer le code ? L\'ancien code ne fonctionnera plus.')) {
      return
    }

    setLoading(true)
    const result = await regenerateInviteCode()

    if (result.error) {
      toast.error(result.error)
    } else if (result.newCode) {
      setCode(result.newCode)
      toast.success('Nouveau code généré')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Code d&apos;invitation</label>
      <p className="text-sm text-muted-foreground">
        Partagez ce code avec vos colocataires pour qu&apos;ils rejoignent votre équipe.
      </p>
      <div className="flex gap-2">
        <Input
          value={code}
          readOnly
          className="font-mono text-sm"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRegenerate}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  )
}
