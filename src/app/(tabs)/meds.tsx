import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { Button, Card, H2, P, Screen } from '@/components/ui'
import { useApp, useData } from '@/lib/app'
import { dayKey } from '@/lib/dates'
import { getMedLog, getMeds, logMed } from '@/lib/db'
import { colors } from '@/lib/theme'

export default function Meds() {
  const { db, refresh } = useApp()
  const today = dayKey()
  const data = useData(async (d) => ({ meds: await getMeds(d), log: await getMedLog(d, today) }), {
    meds: [],
    log: [],
  })
  const status = (medId: number, time: string) =>
    data.log.find((l) => l.medId === medId && l.date === today && l.time === time)?.status

  const mark = async (medId: number, time: string, s: 'taken' | 'skipped') => {
    await logMed(db, { medId, date: today, time, status: s })
    await refresh()
  }

  return (
    <Screen>
      <P soft>
        Застосунок лише нагадує про ліки, які вам призначив лікар. Не починайте, не скасовуйте й не
        змінюйте дозу без нього.
      </P>
      {data.meds.length === 0 && (
        <Card>
          <H2>Список порожній</H2>
          <P>Додайте ліки й час прийому, і застосунок нагадуватиме.</P>
        </Card>
      )}
      {data.meds.map((m) => (
        <Card key={m.id}>
          <Pressable
            onPress={() => router.push({ pathname: '/med', params: { id: String(m.id) } })}
          >
            <H2>
              {m.name}
              {m.dose ? ` · ${m.dose}` : ''}
            </H2>
            {!m.active && <P soft>Нагадування вимкнено</P>}
          </Pressable>
          {m.active &&
            m.times.map((t) => {
              const s = status(m.id, t)
              return (
                <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: colors.text, fontSize: 16, width: 56 }}>{t}</Text>
                  {s ? (
                    <Text style={{ color: s === 'taken' ? colors.calm : colors.soft, flex: 1 }}>
                      {s === 'taken' ? 'Прийнято' : 'Пропущено'}
                    </Text>
                  ) : (
                    <>
                      <View style={{ flex: 1 }}>
                        <Button title="Прийняв(-ла)" onPress={() => mark(m.id, t, 'taken')} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          title="Пропустити"
                          kind="secondary"
                          onPress={() => mark(m.id, t, 'skipped')}
                        />
                      </View>
                    </>
                  )}
                </View>
              )
            })}
        </Card>
      ))}
      <Button title="Додати ліки" kind="secondary" onPress={() => router.push('/med')} />
    </Screen>
  )
}
