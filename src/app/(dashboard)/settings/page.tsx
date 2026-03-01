import { getProfile, updateProfile } from '@/lib/actions/profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AvatarUpload } from '@/components/profile/AvatarUpload'

export default async function SettingsPage() {
  const { data: profile, user } = await getProfile()

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>
            Modifiez vos informations de profil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="space-y-6">
            <div className="flex items-center gap-4">
              <AvatarUpload currentUrl={profile?.avatar_url ?? null} initials={initials} />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Photo de profil</p>
                <p>Cliquez sur l&apos;avatar pour changer votre photo.</p>
                <p>Formats acceptés : JPG, PNG, WebP.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                L&apos;email ne peut pas être modifié.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={profile?.full_name || ''}
                placeholder="Votre nom"
              />
            </div>

            <Button type="submit">Enregistrer</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
