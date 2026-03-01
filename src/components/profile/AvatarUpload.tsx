'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { uploadAvatar } from '@/lib/actions/profile'
import { toast } from 'sonner'

interface AvatarUploadProps {
  currentUrl: string | null
  initials: string
}

export function AvatarUpload({ currentUrl, initials }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview
    setPreview(URL.createObjectURL(file))
    setLoading(true)

    const formData = new FormData()
    formData.append('avatar', file)

    const { error } = await uploadAvatar(formData)
    setLoading(false)

    if (error) {
      toast.error(error)
      setPreview(null)
    } else {
      toast.success('Photo de profil mise à jour')
    }

    // Reset input so the same file can be re-selected if needed
    e.target.value = ''
  }

  return (
    <div className="relative group w-fit cursor-pointer" onClick={() => inputRef.current?.click()}>
      <Avatar className="h-20 w-20">
        <AvatarImage src={preview ?? currentUrl ?? ''} />
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>

      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
        {loading
          ? <Loader2 className="h-5 w-5 text-white animate-spin" />
          : <Camera className="h-5 w-5 text-white" />
        }
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={loading}
      />
    </div>
  )
}
