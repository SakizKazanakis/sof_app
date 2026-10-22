import { Link, router } from 'expo-router'
import { Pressable, Text } from 'react-native'

import { Button, Card, H1, H2, P, Screen } from '@/components/ui'
import { useApp, useData } from '@/lib/app'
import { addDays, dayKey } from '@/lib/dates'
import { getCheckins, getMedLog, getMeds } from '@/lib/db'
import { greeting } from '@/lib/greeting'
import { signals } from '@/lib/insights'
import { colors } from '@/lib/theme'

const word = (n: number, labels: string[]) => labels[Math.min(Math.max(n, 1), 5) - 1]
const moodWord = ['дуже важкий', 'поганий', 'так собі', 'непоганий', 'добрий']
const anxietyWord = ['немає', 'легка', 'помірна', 'сильна', 'дуже сильна']

export default function Today() {
  const { profile, encrypted } = useApp()
  const today = dayKey()
  const data = useData(
    async (db) => ({
      checkins: await getCheckins(db, addDays(today, -14)),
      meds: await getMeds(db),
      log: await getMedLog(db, today),
    }),
    { checkins: [], meds: [], log: [] },
  )
  const todayCheckin = data.checkins.find((c) => c.date === today)
  const found = signals(data.checkins, today)
  const doses = data.meds.filter((m) => m.active).flatMap((m) => m.times.map((t) => ({ m, t })))
  const taken = doses.filter(({ m, t }) => data.log.some((l) => l.medId === m.id && l.time === t))

  return (
    <Screen>
      <H1>{greeting(profile?.name ?? '')}</H1>
      {!encrypted && <P soft>Тестовий режим: у цій збірці дані на телефоні не зашифровані.</P>}

      {todayCheckin ? (
        <Card>
          <H2>Сьогодні</H2>
          <P>
            Сон {todayCheckin.sleepHours} год, настрій {word(todayCheckin.mood, moodWord)}, тривога{' '}
            {word(todayCheckin.anxiety, anxietyWord)}.
          </P>
          <Link href="/checkin" asChild>
            <Pressable>
              <Text style={{ color: colors.soft, textDecorationLine: 'underline' }}>
                Змінити відповіді
              </Text>
            </Pressable>
          </Link>
        </Card>
      ) : (
        <Card>
          <H2>Ранкова відмітка</H2>
          <P>П’ять коротких питань про сон і настрій.</P>
          <Button title="Відповісти" onPress={() => router.push('/checkin')} />
        </Card>
      )}

      {found.map((s) => (
        <Card key={s.id} tone={s.urgent ? 'urgent' : 'warn'}>
          <H2>{s.title}</H2>
          <P>{s.text}</P>
          <Button
            title={s.urgent ? 'Кому подзвонити' : 'Куди звернутися'}
            kind={s.urgent ? 'primary' : 'secondary'}
            onPress={() => router.push('/help')}
          />
        </Card>
      ))}

      {doses.length > 0 && (
        <Card>
          <H2>Ліки сьогодні</H2>
          <P>
            Відмічено {taken.length} з {doses.length}.
          </P>
          <Button title="Відмітити" kind="secondary" onPress={() => router.push('/meds')} />
        </Card>
      )}

      <Card>
        <H2>Хвилина для себе</H2>
        <P>Дихання 4–6: повільний вдих і довший видих знижують напругу.</P>
        <Button title="Почати вправу" kind="secondary" onPress={() => router.push('/breathing')} />
      </Card>

      <Link href="/settings" asChild>
        <Pressable accessibilityRole="link">
          <Text style={{ color: colors.soft, textAlign: 'center', paddingVertical: 8 }}>
            Налаштування
          </Text>
        </Pressable>
      </Link>
    </Screen>
  )
}
