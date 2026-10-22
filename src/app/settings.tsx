import { router } from 'expo-router'
import { useState } from 'react'
import { Alert } from 'react-native'

import { Button, Card, Field, H2, P, Screen } from '@/components/ui'
import { useApp } from '@/lib/app'
import { formatTime, parseTime } from '@/lib/dates'
import { saveProfile, wipe } from '@/lib/db'

export default function Settings() {
  const { db, profile, afterChange, encrypted } = useApp()
  const [name, setName] = useState(profile?.name ?? '')
  const [time, setTime] = useState(
    profile ? formatTime(profile.checkinHour, profile.checkinMinute) : '08:00',
  )

  const save = async () => {
    const t = parseTime(time)
    if (!profile || !name.trim() || !t)
      return Alert.alert('Перевірте поля', "Ім'я і час у форматі 08:00.")
    await saveProfile(db, {
      ...profile,
      name: name.trim(),
      checkinHour: t.hour,
      checkinMinute: t.minute,
    })
    await afterChange()
    router.back()
  }

  const erase = () =>
    Alert.alert(
      'Видалити всі дані?',
      'Відмітки, ліки й налаштування буде стерто з телефона назавжди.',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            await wipe(db)
            Alert.alert('Дані видалено', 'Перезапустіть застосунок.')
          },
        },
      ],
    )

  return (
    <Screen>
      <Field label="Як до вас звертатися" value={name} onChangeText={setName} maxLength={40} />
      <Field
        label="Ранкове нагадування"
        value={time}
        onChangeText={setTime}
        maxLength={5}
        keyboardType="numbers-and-punctuation"
      />
      <Button title="Зберегти" onPress={save} />
      <Card>
        <H2>Ваші дані</H2>
        <P>
          Зберігаються лише на цьому телефоні
          {encrypted
            ? ', база зашифрована ключем із захищеного сховища системи'
            : '. У цій тестовій збірці база не зашифрована'}
          . Застосунок нічого не надсилає в інтернет.
        </P>
        <Button title="Видалити всі дані" kind="danger" onPress={erase} />
      </Card>
    </Screen>
  )
}
