import React from 'react'
import { fetchBars, fetchAnnonces } from '../services'
import { BARS_DATA, ANNONCES_PUBLIC, USER_DATA } from '../data'

const DataContext = React.createContext(null)

export function DataProvider({ children }) {
  const [bars, setBars] = React.useState(null)
  const [annonces, setAnnonces] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [barsData, annoncesData] = await Promise.all([
          fetchBars(),
          fetchAnnonces(),
        ])
        if (!cancelled) {
          setBars(barsData?.length ? barsData : BARS_DATA)
          setAnnonces(annoncesData?.length ? annoncesData : ANNONCES_PUBLIC)
        }
      } catch (err) {
        console.warn('Supabase non disponible, données locales utilisées:', err.message)
        if (!cancelled) {
          setBars(BARS_DATA)
          setAnnonces(ANNONCES_PUBLIC)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const value = {
    bars: bars ?? BARS_DATA,
    annonces: annonces ?? ANNONCES_PUBLIC,
    user: USER_DATA,
    loading,
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = React.useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
