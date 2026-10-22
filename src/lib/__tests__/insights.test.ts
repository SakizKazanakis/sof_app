import { addDays, dayKey, lastDays, parseTime } from '../dates'
import { greeting } from '../greeting'
import { moodTrend, signals, summarize } from '../insights'
import type { Checkin } from '../types'

const today = '2026-10-22'
const day = (offset: number, patch: Partial<Checkin> = {}): Checkin => ({
  date: addDays(today, offset),
  sleepHours: 7,
  sleepQuality: 4,
  mood: 4,
  anxiety: 2,
  energy: 3,
  note: null,
  ...patch,
})

describe('dates', () => {
  it('builds local day keys and ranges across months', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31')
    expect(lastDays(3, today)).toEqual(['2026-10-20', '2026-10-21', '2026-10-22'])
  })
  it('parses reminder times', () => {
    expect(parseTime('8:05')).toEqual({ hour: 8, minute: 5 })
    expect(parseTime('24:00')).toBeNull()
    expect(parseTime('ранок')).toBeNull()
  })
})

describe('greeting', () => {
  it('depends on the time of day', () => {
    expect(greeting('Олег', new Date(2026, 9, 22, 7))).toBe('Доброго ранку, Олег')
    expect(greeting('', new Date(2026, 9, 22, 21))).toBe('Добрий вечір')
  })
})

describe('signals', () => {
  it('stays quiet on ordinary days', () => {
    expect(signals([day(-2), day(-1), day(0)], today)).toEqual([])
  })
  it('notices three low-mood days in a row', () => {
    const items = [day(-2, { mood: 2 }), day(-1, { mood: 1 }), day(0, { mood: 2 })]
    expect(signals(items, today).map((s) => s.id)).toContain('low-mood')
  })
  it('does not count a streak broken by a missing day', () => {
    const items = [day(-3, { mood: 1 }), day(-1, { mood: 1 }), day(0, { mood: 1 })]
    expect(signals(items, today).map((s) => s.id)).not.toContain('low-mood')
  })
  it('flags a very hard day as urgent', () => {
    const [s] = signals([day(0, { mood: 1, anxiety: 5 })], today)
    expect(s).toMatchObject({ id: 'hard-today', urgent: true })
  })
  it('notices short sleep and high anxiety', () => {
    const items = [-2, -1, 0].map((o) => day(o, { sleepHours: 4, anxiety: 4 }))
    expect(signals(items, today).map((s) => s.id)).toEqual(['short-sleep', 'high-anxiety'])
  })
})

describe('summaries', () => {
  it('averages only the requested window', () => {
    const items = [day(-10, { mood: 1 }), day(-1, { mood: 3 }), day(0, { mood: 5 })]
    expect(summarize(items, 7, today)).toMatchObject({ days: 2, mood: 4 })
  })
  it('compares this week with the previous one', () => {
    const items = [day(-8, { mood: 2 }), day(-1, { mood: 4 })]
    expect(moodTrend(items, today)).toBe(2)
    expect(moodTrend([day(0)], today)).toBeNull()
  })
})
