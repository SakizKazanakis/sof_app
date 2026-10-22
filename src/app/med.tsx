import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Switch, Text, View } from 'react-native'

import { Button, Field, Screen } from '@/components/ui'
import { useApp } from '@/lib/app'
import { parseTime, formatTime } from '@/lib/dates'
import { deleteMed, getMed, saveMed } from '@/lib/db'
import { colors } from '@/lib/theme'

export default function MedEdit() {
  const { db, afterChange } = useApp()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [times, setTimes] = useState('08:00')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (!id) return
    getMed(db, Number(id)).then((m) => {
      if (!m) return
      setName(m.name)
      setDose(m.dose)
      setTimes(m.times.join(', '))
      setActive(m.active)
    })
  }, [db, id])

  const save = async () => {
    const parsed = times
      .split(/[,;\s]+/)
      .filter(Boolean)
      .map(parseTime)
    if (!name.trim()) return Alert.alert('Назва ліків', 'Вкажіть, що саме приймаєте.')
    if (!parsed.length || parsed.some((t) => !t))
      return Alert.alert('Перевірте час', 'Вкажіть час через кому, наприклад 08:00, 20:00.')
    await saveMed(db, {
      id: id ? Number(id) : undefined,
      name: name.trim(),
      dose: dose.trim(),
      times: [...new Set(parsed.map((t) => formatTime(t!.hour, t!.minute)))],
      active,
    })
    await afterChange()
    router.back()
  }

  const remove = () =>
    Alert.alert('Видалити ліки?', 'Історію прийомів теж буде видалено.', [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: async () => {
          await deleteMed(db, Number(id))
          await afterChange()
          router.back()
        },
      },
    ])

  return (
    <Screen>
      <Field
        label="Назва"
        value={name}
        onChangeText={setName}
        maxLength={60}
        placeholder="Як у призначенні"
      />
      <Field
        label="Доза (необов'язково)"
        value={dose}
        onChangeText={setDose}
        maxLength={40}
        placeholder="Наприклад, 1 таблетка"
      />
      <Field
        label="Час прийому"
        value={times}
        onChangeText={setTimes}
        maxLength={60}
        keyboardType="numbers-and-punctuation"
        hint="Кілька разів на день — через кому: 08:00, 20:00"
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.text, fontSize: 15 }}>Нагадувати</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <Button title="Зберегти" onPress={save} />
      {id && <Button title="Видалити" kind="danger" onPress={remove} />}
    </Screen>
  )
}
