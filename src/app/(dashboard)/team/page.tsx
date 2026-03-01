import { getTeamInfo } from '@/lib/actions/team'
import { createClient } from '@/lib/supabase/server'
import { STATUS_CONFIG, STATUS_ORDER } from '@/lib/apartment-status'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { InviteCode } from '@/components/team/InviteCode'
import { TeamMembers } from '@/components/team/TeamMembers'
import { updateTeamName } from '@/lib/actions/team'
import type { ApartmentStatus } from '@/types/database'

const STATUS_BAR_COLORS: Record<ApartmentStatus, string> = {
  to_visit:         'bg-slate-400',
  visit_planned:    'bg-blue-400',
  visited:          'bg-purple-400',
  application_sent: 'bg-amber-400',
  rejected:         'bg-red-400',
}

export default async function TeamPage() {
  const { data, error } = await getTeamInfo()

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-500">Erreur: {error}</p>
      </div>
    )
  }

  const { team, members, currentUserId } = data

  // Fetch apartment stats
  const supabase = await createClient()
  const { data: apartments } = await supabase
    .from('apartments')
    .select('status, is_archived, ratings(score)')
    .eq('team_id', team.id)

  const all = apartments ?? []
  const active = all.filter((a) => !a.is_archived)
  const total = active.length

  const bySatus = STATUS_ORDER.map((s) => ({
    status: s,
    count: active.filter((a) => (a.status ?? 'to_visit') === s).length,
  }))

  const allScores = all.flatMap((a) =>
    (a.ratings as { score: number }[]).map((r) => r.score)
  )
  const avgRating = allScores.length
    ? (allScores.reduce((s, v) => s + v, 0) / allScores.length).toFixed(1)
    : null

  const withApplication = active.filter((a) => a.status === 'application_sent').length
  const visited = active.filter(
    (a) => a.status === 'visited' || a.status === 'application_sent' || a.status === 'rejected'
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mon équipe</h1>
        <p className="text-muted-foreground">
          Gérez votre équipe et suivez l&apos;avancée des recherches.
        </p>
      </div>

      {/* ── Mini dashboard ─────────────────────────────────────────── */}
      {total > 0 && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="py-4">
              <CardContent className="text-center">
                <p className="text-3xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground mt-1">Appartements suivis</p>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardContent className="text-center">
                <p className="text-3xl font-bold">{visited}</p>
                <p className="text-xs text-muted-foreground mt-1">Visités</p>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardContent className="text-center">
                <p className="text-3xl font-bold">{withApplication}</p>
                <p className="text-xs text-muted-foreground mt-1">Candidatures envoyées</p>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardContent className="text-center">
                <p className="text-3xl font-bold">{avgRating ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Note moyenne</p>
              </CardContent>
            </Card>
          </div>

          {/* Status breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Répartition par statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bySatus.map(({ status, count }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{STATUS_CONFIG[status].label}</span>
                      <span className="font-medium tabular-nums">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${STATUS_BAR_COLORS[status]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Team management ────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>
              Modifiez les informations de votre équipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={updateTeamName} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nom de l&apos;équipe
                </label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={team.name}
                  required
                />
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>

            <div className="pt-4 border-t">
              <InviteCode code={team.invite_code} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membres ({members.length})</CardTitle>
            <CardDescription>
              Les personnes qui font partie de votre équipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMembers members={members} currentUserId={currentUserId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
