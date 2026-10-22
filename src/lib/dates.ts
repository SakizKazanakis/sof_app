/** Дата у місцевому часі у вигляді 2026-10-22: ключ для щоденних записів. */
export const dayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const addDays = (key: string, days: number) => {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + days))
}

/** Останні n днів, від найстарішого до сьогодні. */
export const lastDays = (n: number, today: string = dayKey()) =>
  Array.from({ length: n }, (_, i) => addDays(today, i - n + 1))

const weekdays = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
export const weekdayShort = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return weekdays[new Date(y, m - 1, d).getDay()]
}

/** "08:30" → { hour: 8, minute: 30 }; некоректний рядок → null. */
export const parseTime = (value: string) => {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim())
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null
}

export const formatTime = (hour: number, minute: number) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
