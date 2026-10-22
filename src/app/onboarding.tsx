import { router } from 'expo-router'
import { useState } from 'react'
import { Alert } from 'react-native'

import { Button, Card, Choice, Field, H1, P, Screen } from '@/components/ui'
import { useApp } from '@/lib/app'
import { formatTime, parseTime } from '@/lib/dates'
import { saveProfile } from '@/lib/db'
import { ensurePermission } from '@/lib/notifications'
import type { Role } from '@/lib/types'

export default function Onboarding() {
  const { db, afterChange, encrypted } = useApp()
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('veteran')
  const [time, setTime] = useState(formatTime(8, 0))

  const start = async () => {
    const t = parseTime(time)
    if (!name.trim()) return Alert.alert('Як до вас звертатися?', 'Достатньо імені або позивного.')
    if (!t) return Alert.alert('Перевірте час', 'Вкажіть час у форматі 08:00.')
    await saveProfile(db, { name: name.trim(), role, checkinHour: t.hour, checkinMinute: t.minute })
    await ensurePermission().catch(() => false)
    await afterChange()
    router.replace('/')
  }

  return (
    <Screen>
      <H1>Вітаємо</H1>
      <P>
        Це щоденник самопочуття від Всеукраїнської спілки ветеранів ССО. Щоранку дві хвилини: як
        спалося, який настрій. Застосунок покаже, як змінюється стан, і нагадає про ліки.
      </P>
      <Card>
        <P>
          Усе, що ви записуєте, зберігається лише на цьому телефоні
          {encrypted ? ' в зашифрованому вигляді' : ''}. Нікуди не надсилається. Застосунок не
          ставить діагнозів і не замінює психолога чи лікаря.
        </P>
      </Card>
      <Field
        label="Як до вас звертатися"
        value={name}
        onChangeText={setName}
        placeholder="Ім'я або позивний"
        autoCapitalize="words"
        maxLength={40}
      />
      <Choice
        label="Хто ви"
        value={role}
        onChange={setRole}
        options={[
          { value: 'veteran', label: 'Ветеран' },
          { value: 'military', label: 'Військовий' },
          { value: 'family', label: 'Член родини' },
        ]}
      />
      <Field
        label="Коли нагадувати про ранкову відмітку"
        value={time}
        onChangeText={setTime}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        hint="Наприклад, 07:30. Можна змінити в налаштуваннях."
      />
      <Button title="Почати" onPress={start} />
    </Screen>
  )
}
