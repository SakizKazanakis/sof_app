import { useWindowDimensions } from 'react-native'

import { Bars } from '@/components/Bars'
import { Card, H2, P, Screen } from '@/components/ui'
import { useData } from '@/lib/app'
import { dayKey, lastDays, weekdayShort } from '@/lib/dates'
import { getCheckins } from '@/lib/db'
import { moodTrend, summarize } from '@/lib/insights'
import { colors } from '@/lib/theme'
import type { Checkin } from '@/lib/types'

const DAYS = 14
const fmt = (n: number | null, digits = 1) =>
  n === null ? '—' : n.toFixed(digits).replace('.', ',')

export default function Trends() {
  const { width } = useWindowDimensions()
  const today = dayKey()
  const days = lastDays(DAYS, today)
  const checkins = useData((db) => getCheckins(db, days[0]), [] as Checkin[])
  const by = new Map(checkins.map((c) => [c.date, c]))
  const labels = days.map((d, i) => (i % 2 === DAYS % 2 ? '' : weekdayShort(d)))
  const series = (pick: (c: Checkin) => number) =>
    days.map((d) => (by.has(d) ? pick(by.get(d)!) : null))
  const week = summarize(checkins, 7, today)
  const trend = moodTrend(checkins, today)
  const chartW = width - 64

  if (!checkins.length)
    return (
      <Screen>
        <Card>
          <H2>Поки порожньо</H2>
          <P>Графіки з’являться після кількох ранкових відміток.</P>
        </Card>
      </Screen>
    )

  return (
    <Screen>
      <Card>
        <H2>Останні 7 днів</H2>
        <P>
          Відміток: {week.days}. Сон у середньому {fmt(week.sleepHours)} год, настрій{' '}
          {fmt(week.mood)} з 5, тривога {fmt(week.anxiety)} з 5.
        </P>
        {trend !== null && (
          <P soft>
            {Math.abs(trend) < 0.3
              ? 'Настрій приблизно такий самий, як тижнем раніше.'
              : trend > 0
                ? 'Настрій кращий, ніж тижнем раніше.'
                : 'Настрій гірший, ніж тижнем раніше. Якщо так триває, варто поговорити з фахівцем.'}
          </P>
        )}
      </Card>
      <Card>
        <H2>Сон, години</H2>
        <Bars values={series((c) => c.sleepHours)} labels={labels} max={10} width={chartW} />
      </Card>
      <Card>
        <H2>Настрій</H2>
        <Bars values={series((c) => c.mood)} labels={labels} max={5} width={chartW} />
      </Card>
      <Card>
        <H2>Тривога</H2>
        <Bars
          values={series((c) => c.anxiety)}
          labels={labels}
          max={5}
          color={colors.warn}
          width={chartW}
        />
      </Card>
      <P soft>
        Це ваші власні оцінки, а не медичні показники. Порожній стовпчик — день без відмітки.
      </P>
    </Screen>
  )
}
