export type Role = 'veteran' | 'military' | 'family'

export type Profile = {
  name: string
  role: Role
  checkinHour: number
  checkinMinute: number
}

/** Ранкова відмітка. Шкали від 1 (погано) до 5 (добре); тривога: 1 — немає, 5 — дуже сильна. */
export type Checkin = {
  date: string
  sleepHours: number
  sleepQuality: number
  mood: number
  anxiety: number
  energy: number
  note: string | null
}

export type Med = {
  id: number
  name: string
  dose: string
  times: string[]
  active: boolean
}

export type MedLog = {
  medId: number
  date: string
  time: string
  status: 'taken' | 'skipped'
}
