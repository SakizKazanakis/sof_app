import { router } from 'expo-router'
import { useState } from 'react'
import { Alert } from 'react-native'

import { Button, Field, H2, P, Scale, Screen } from '@/components/ui'
import { useApp, useData } from '@/lib/app'
import { dayKey } from '@/lib/dates'
import { getCheckins, saveCheckin } from '@/lib/db'
import { greeting } from '@/lib/greeting'
import type { Checkin } from '@/lib/types'

type Draft = Omit<Checkin, 'date' | 'sleepHours' | 'note'> & { sleepHours: string; note: string }
const empty = { sleepHours: '', sleepQuality: 0, mood: 0, anxiety: 0, energy: 0, note: '' }

export default function CheckinScreen() {
  const { db, profile, refresh } = useApp()
  const today = dayKey()
  const existing = useData((d) => getCheckins(d, today), [] as Checkin[])[0]
  const [draft, setDraft] = useState<Draft | null>(null)
  const value: Draft =
    draft ??
    (existing
      ? { ...existing, sleepHours: String(existing.sleepHours), note: existing.note ?? '' }
      : empty)
  const set = (patch: Partial<Draft>) => setDraft({ ...value, ...patch })

  const save = async () => {
    const hours = Number(value.sleepHours.replace(',', '.'))
    if (!(hours >= 0 && hours <= 24))
      return Alert.alert('Скільки годин ви спали?', 'Вкажіть число від 0 до 24.')
    if (!value.sleepQuality || !value.mood || !value.anxiety || !value.energy)
      return Alert.alert('Ще кілька відповідей', 'Оцініть кожен пункт від 1 до 5.')
    await saveCheckin(db, {
      date: today,
      sleepHours: hours,
      sleepQuality: value.sleepQuality,
      mood: value.mood,
      anxiety: value.anxiety,
      energy: value.energy,
      note: value.note.trim() || null,
    })
    await refresh()
    router.back()
  }

  return (
    <Screen>
      <H2>{greeting(profile?.name ?? '')}</H2>
      <P soft>Відповідайте як є, правильних відповідей тут немає.</P>
      <Field
        label="Скільки годин спали"
        value={value.sleepHours}
        onChangeText={(t) => set({ sleepHours: t })}
        keyboardType="decimal-pad"
        placeholder="Наприклад, 6,5"
        maxLength={4}
      />
      <Scale
        label="Як спалося"
        value={value.sleepQuality || null}
        onChange={(v) => set({ sleepQuality: v })}
        low="Погано"
        high="Добре"
      />
      <Scale
        label="Настрій зараз"
        value={value.mood || null}
        onChange={(v) => set({ mood: v })}
        low="Дуже поганий"
        high="Добрий"
      />
      <Scale
        label="Тривога, напруга"
        value={value.anxiety || null}
        onChange={(v) => set({ anxiety: v })}
        low="Немає"
        high="Дуже сильна"
      />
      <Scale
        label="Сили на день"
        value={value.energy || null}
        onChange={(v) => set({ energy: v })}
        low="Немає"
        high="Багато"
      />
      <Field
        label="Нотатка для себе (необов'язково)"
        value={value.note}
        onChangeText={(t) => set({ note: t })}
        multiline
        maxLength={500}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />
      <Button title={existing ? 'Оновити' : 'Зберегти'} onPress={save} />
    </Screen>
  )
}
