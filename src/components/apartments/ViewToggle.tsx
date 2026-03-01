'use client'

import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useView } from './view-context'

export function ViewToggle() {
  const { view, setView } = useView()

  return (
    <div className="flex rounded-md border overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 rounded-none ${view === 'grid' ? 'bg-muted' : ''}`}
        onClick={() => setView('grid')}
        title="Vue grille"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 rounded-none ${view === 'list' ? 'bg-muted' : ''}`}
        onClick={() => setView('list')}
        title="Vue liste"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}
