import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import { getMeds, getProfile, openDb, type Db } from './db'
import { reschedule } from './notifications'
import type { Profile } from './types'

type AppState = {
  db: Db
  encrypted: boolean
  profile: Profile | null
  /** Лічильник змін: екрани перечитують дані, коли він зростає. */
  version: number
  refresh: () => Promise<void>
  /** Після зміни профілю або ліків — оновити дані й перепланувати нагадування. */
  afterChange: () => Promise<void>
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [db, setDb] = useState<{ db: Db; encrypted: boolean } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    openDb().then(async (opened) => {
      setProfile(await getProfile(opened.db))
      setDb(opened)
    })
  }, [])

  const refresh = useCallback(async () => {
    if (!db) return
    setProfile(await getProfile(db.db))
    setVersion((v) => v + 1)
  }, [db])

  const afterChange = useCallback(async () => {
    if (!db) return
    const p = await getProfile(db.db)
    if (p) await reschedule(p, await getMeds(db.db)).catch(() => undefined)
    await refresh()
  }, [db, refresh])

  if (!db) return fallback
  return (
    <Ctx.Provider value={{ ...db, profile, version, refresh, afterChange }}>
      {children}
    </Ctx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp outside AppProvider')
  return ctx
}

/** Завантажити дані й перечитувати їх після кожної зміни в застосунку. */
export function useData<T>(load: (db: Db) => Promise<T>, initial: T) {
  const { db, version } = useApp()
  const [data, setData] = useState<T>(initial)
  useEffect(() => {
    let alive = true
    load(db).then((d) => alive && setData(d))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version])
  return data
}
