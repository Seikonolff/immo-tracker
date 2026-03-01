'use client'

import { useRef, useState } from 'react'
import { createRemark } from '@/lib/actions/remarks'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface RemarkFormProps {
  apartmentId: string
}

export function RemarkForm({ apartmentId }: RemarkFormProps) {
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    const result = await createRemark(apartmentId, content.trim())

    if (result.error) {
      toast.error(result.error)
    } else {
      setContent('')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        ref={textareaRef}
        placeholder="Ajouter une remarque..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        disabled={loading}
      />
      <Button type="submit" size="sm" disabled={loading || !content.trim()}>
        {loading ? 'Ajout...' : 'Ajouter'}
      </Button>
    </form>
  )
}
