import { addDays, lastDays } from './dates'
import type { Checkin } from './types'

export type Signal = { id: string; title: string; text: string; urgent?: boolean }

const avg = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null

export type Summary = {
  days: number
  mood: number | null
  sleepHours: number | null
  anxiety: number | null
  energy: number | null
}

export const summarize = (items: Checkin[], days: number, today?: string): Summary => {
  const keys = new Set(lastDays(days, today))
  const inRange = items.filter((c) => keys.has(c.date))
  return {
    days: inRange.length,
    mood: avg(inRange.map((c) => c.mood)),
    sleepHours: avg(inRange.map((c) => c.sleepHours)),
    anxiety: avg(inRange.map((c) => c.anxiety)),
    energy: avg(inRange.map((c) => c.energy)),
  }
}

/** Скільки днів поспіль до сьогодні (включно) виконується умова; пропущений день перериває ряд. */
const streak = (byDate: Map<string, Checkin>, today: string, test: (c: Checkin) => boolean) => {
  let n = 0
  for (let key = today; ; key = addDays(key, -1)) {
    const c = byDate.get(key)
    if (!c || !test(c)) return n
    n++
  }
}

/**
 * М'які сигнали за останніми відмітками. Це не діагноз: застосунок лише помічає тенденцію
 * і пропонує поговорити з фахівцем. Пороги — робочі, їх мають переглянути психологи спілки.
 */
export const signals = (items: Checkin[], today: string): Signal[] => {
  const byDate = new Map(items.map((c) => [c.date, c]))
  const out: Signal[] = []
  const todayCheckin = byDate.get(today)

  if (todayCheckin && todayCheckin.mood === 1 && todayCheckin.anxiety === 5) {
    out.push({
      id: 'hard-today',
      urgent: true,
      title: 'Сьогодні дуже важко',
      text: 'Не залишайтеся з цим наодинці. Зателефонуйте на кризову лінію або близькій людині просто зараз.',
    })
  }
  if (streak(byDate, today, (c) => c.mood <= 2) >= 3) {
    out.push({
      id: 'low-mood',
      title: 'Настрій низький кілька днів поспіль',
      text: 'Таке буває, і з цим можна працювати. Варто поговорити з психологом: запис є в розділі «Допомога».',
    })
  }
  if (streak(byDate, today, (c) => c.sleepHours < 5) >= 3) {
    out.push({
      id: 'short-sleep',
      title: 'Менше 5 годин сну три ночі поспіль',
      text: 'Тривалий брак сну посилює тривогу й дратівливість. Якщо так триває й далі, скажіть про це фахівцю або сімейному лікарю.',
    })
  }
  if (streak(byDate, today, (c) => c.anxiety >= 4) >= 3) {
    out.push({
      id: 'high-anxiety',
      title: 'Тривога висока вже кілька днів',
      text: 'Спробуйте вправу на дихання в розділі «Допомога». Якщо легше не стає, зверніться до психолога.',
    })
  }
  return out
}

/** Різниця середнього настрою за останні 7 днів і попередні 7. */
export const moodTrend = (items: Checkin[], today: string) => {
  const recent = summarize(items, 7, today).mood
  const before = summarize(items, 7, addDays(today, -7)).mood
  if (recent === null || before === null) return null
  return recent - before
}
