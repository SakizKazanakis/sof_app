import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'
import * as SQLite from 'expo-sqlite'

import type { Checkin, Med, MedLog, Profile } from './types'

const KEY_NAME = 'sof.db.key'

/** Ключ шифрування живе лише в захищеному сховищі телефона (Keychain / Keystore). */
async function databaseKey() {
  const existing = await SecureStore.getItemAsync(KEY_NAME)
  if (existing) return existing
  const bytes = Crypto.getRandomBytes(32)
  const key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  await SecureStore.setItemAsync(KEY_NAME, key, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  })
  return key
}

const MIGRATIONS = [
  `CREATE TABLE profile (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     name TEXT NOT NULL,
     role TEXT NOT NULL,
     checkin_hour INTEGER NOT NULL,
     checkin_minute INTEGER NOT NULL,
     created_at TEXT NOT NULL
   );
   CREATE TABLE checkins (
     date TEXT PRIMARY KEY,
     sleep_hours REAL NOT NULL,
     sleep_quality INTEGER NOT NULL,
     mood INTEGER NOT NULL,
     anxiety INTEGER NOT NULL,
     energy INTEGER NOT NULL,
     note TEXT,
     created_at TEXT NOT NULL
   );
   CREATE TABLE meds (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     dose TEXT NOT NULL DEFAULT '',
     times TEXT NOT NULL,
     active INTEGER NOT NULL DEFAULT 1
   );
   CREATE TABLE med_log (
     med_id INTEGER NOT NULL REFERENCES meds(id) ON DELETE CASCADE,
     date TEXT NOT NULL,
     time TEXT NOT NULL,
     status TEXT NOT NULL,
     at TEXT NOT NULL,
     PRIMARY KEY (med_id, date, time)
   );`,
]

export type Db = SQLite.SQLiteDatabase

/**
 * Відкриває базу. Якщо збірка має SQLCipher, база шифрується ключем із захищеного сховища.
 * В Expo Go SQLCipher немає: тоді encrypted = false, і застосунок попереджає, що це тестовий режим.
 */
export async function openDb(): Promise<{ db: Db; encrypted: boolean }> {
  const db = await SQLite.openDatabaseAsync('sof.db')
  const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version')
  const encrypted = Boolean(cipher?.cipher_version)
  if (encrypted) {
    const key = await databaseKey()
    // Ключ — 64 шістнадцяткові символи з генератора, тож підставляти його в рядок безпечно.
    await db.execAsync(`PRAGMA key = "x'${key}'"`)
  }
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
  const { user_version } = (await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  )) ?? { user_version: 0 }
  for (let v = user_version; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v])
      await db.execAsync(`PRAGMA user_version = ${v + 1}`)
    })
  }
  return { db, encrypted }
}

export async function getProfile(db: Db): Promise<Profile | null> {
  const row = await db.getFirstAsync<{
    name: string
    role: Profile['role']
    checkin_hour: number
    checkin_minute: number
  }>('SELECT name, role, checkin_hour, checkin_minute FROM profile WHERE id = 1')
  return row
    ? {
        name: row.name,
        role: row.role,
        checkinHour: row.checkin_hour,
        checkinMinute: row.checkin_minute,
      }
    : null
}

export async function saveProfile(db: Db, p: Profile) {
  await db.runAsync(
    `INSERT INTO profile (id, name, role, checkin_hour, checkin_minute, created_at)
     VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, role = excluded.role,
       checkin_hour = excluded.checkin_hour, checkin_minute = excluded.checkin_minute`,
    p.name,
    p.role,
    p.checkinHour,
    p.checkinMinute,
    new Date().toISOString(),
  )
}

type CheckinRow = {
  date: string
  sleep_hours: number
  sleep_quality: number
  mood: number
  anxiety: number
  energy: number
  note: string | null
}
const toCheckin = (r: CheckinRow): Checkin => ({
  date: r.date,
  sleepHours: r.sleep_hours,
  sleepQuality: r.sleep_quality,
  mood: r.mood,
  anxiety: r.anxiety,
  energy: r.energy,
  note: r.note,
})

export async function getCheckins(db: Db, since: string): Promise<Checkin[]> {
  const rows = await db.getAllAsync<CheckinRow>(
    'SELECT * FROM checkins WHERE date >= ? ORDER BY date',
    since,
  )
  return rows.map(toCheckin)
}

export async function saveCheckin(db: Db, c: Checkin) {
  await db.runAsync(
    `INSERT INTO checkins (date, sleep_hours, sleep_quality, mood, anxiety, energy, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET sleep_hours = excluded.sleep_hours,
       sleep_quality = excluded.sleep_quality, mood = excluded.mood, anxiety = excluded.anxiety,
       energy = excluded.energy, note = excluded.note`,
    c.date,
    c.sleepHours,
    c.sleepQuality,
    c.mood,
    c.anxiety,
    c.energy,
    c.note,
    new Date().toISOString(),
  )
}

type MedRow = { id: number; name: string; dose: string; times: string; active: number }
const toMed = (r: MedRow): Med => ({
  id: r.id,
  name: r.name,
  dose: r.dose,
  times: JSON.parse(r.times) as string[],
  active: r.active === 1,
})

export async function getMeds(db: Db): Promise<Med[]> {
  return (await db.getAllAsync<MedRow>('SELECT * FROM meds ORDER BY name')).map(toMed)
}

export async function getMed(db: Db, id: number): Promise<Med | null> {
  const row = await db.getFirstAsync<MedRow>('SELECT * FROM meds WHERE id = ?', id)
  return row ? toMed(row) : null
}

export async function saveMed(db: Db, m: Omit<Med, 'id'> & { id?: number }) {
  const times = JSON.stringify([...m.times].sort())
  if (m.id) {
    await db.runAsync(
      'UPDATE meds SET name = ?, dose = ?, times = ?, active = ? WHERE id = ?',
      m.name,
      m.dose,
      times,
      m.active ? 1 : 0,
      m.id,
    )
    return m.id
  }
  const r = await db.runAsync(
    'INSERT INTO meds (name, dose, times, active) VALUES (?, ?, ?, ?)',
    m.name,
    m.dose,
    times,
    m.active ? 1 : 0,
  )
  return r.lastInsertRowId
}

export async function deleteMed(db: Db, id: number) {
  await db.runAsync('DELETE FROM meds WHERE id = ?', id)
}

export async function getMedLog(db: Db, since: string): Promise<MedLog[]> {
  const rows = await db.getAllAsync<{ med_id: number; date: string; time: string; status: string }>(
    'SELECT med_id, date, time, status FROM med_log WHERE date >= ?',
    since,
  )
  return rows.map((r) => ({
    medId: r.med_id,
    date: r.date,
    time: r.time,
    status: r.status as MedLog['status'],
  }))
}

export async function logMed(db: Db, l: MedLog) {
  await db.runAsync(
    `INSERT INTO med_log (med_id, date, time, status, at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(med_id, date, time) DO UPDATE SET status = excluded.status, at = excluded.at`,
    l.medId,
    l.date,
    l.time,
    l.status,
    new Date().toISOString(),
  )
}

/** Повне видалення: база і ключ. Після цього застосунок починає з нуля. */
export async function wipe(db: Db) {
  await db.closeAsync()
  await SQLite.deleteDatabaseAsync('sof.db')
  await SecureStore.deleteItemAsync(KEY_NAME)
}
