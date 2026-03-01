'use client'

import { useState } from 'react'
import { createOrUpdateRating } from '@/lib/actions/ratings'
import { Button } from '@/components/ui/button'
import { StarRating } from './StarRating'
import { toast } from 'sonner'

interface RatingFormProps {
  apartmentId: string
  existingRating?: {
    score: number
    comment: string | null
  }
}

export function RatingForm({ apartmentId, existingRating }: RatingFormProps) {
  const [score, setScore] = useState(existingRating?.score || 0)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (score === 0) {
      toast.error('Veuillez sélectionner une note')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.set('score', score.toString())

    const result = await createOrUpdateRating(apartmentId, formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(existingRating ? 'Note mise à jour' : 'Note ajoutée')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Votre note</label>
        <StarRating value={score} onChange={setScore} size="lg" />
      </div>
      <Button type="submit" disabled={loading || score === 0}>
        {loading
          ? 'Enregistrement...'
          : existingRating
            ? 'Mettre à jour'
            : 'Enregistrer'}
      </Button>
    </form>
  )
}
