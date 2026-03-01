'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type View = 'grid' | 'list'

const ViewContext = createContext<{
  view: View
  setView: (v: View) => void
}>({ view: 'grid', setView: () => {} })

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<View>('grid')

  useEffect(() => {
    const saved = localStorage.getItem('apartment-view')
    if (saved === 'list') setViewState('list')
  }, [])

  function setView(v: View) {
    setViewState(v)
    localStorage.setItem('apartment-view', v)
  }

  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  )
}

export function useView() {
  return useContext(ViewContext)
}
