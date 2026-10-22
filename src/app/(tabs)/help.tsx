import Constants from 'expo-constants'
import { router } from 'expo-router'
import { Linking, Pressable, Text } from 'react-native'

import { Button, Card, H2, P, Screen } from '@/components/ui'
import { crisisLines, telUrl } from '@/lib/crisis'
import { colors } from '@/lib/theme'

// Адреса сторінки запису на сайті спілки; задається в app.json → extra.bookingUrl.
const BOOKING = Constants.expoConfig?.extra?.bookingUrl as string | undefined

export default function Help() {
  return (
    <Screen>
      <Card tone="urgent">
        <H2>Потрібна допомога зараз</H2>
        <P>Якщо вам або близькій людині загрожує небезпека, телефонуйте одразу.</P>
        {crisisLines.map((l) => (
          <Pressable
            key={l.phone}
            accessibilityRole="link"
            accessibilityLabel={`Подзвонити: ${l.name}, ${l.phone}`}
            onPress={() => Linking.openURL(telUrl(l.phone))}
            style={{ paddingVertical: 6 }}
          >
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{l.phone}</Text>
            <Text style={{ color: colors.soft, fontSize: 14 }}>
              {l.name}. {l.note}
            </Text>
          </Pressable>
        ))}
      </Card>
      <Card>
        <H2>Психологи спілки</H2>
        <P>Можна записатися онлайн або на очний прийом. Запис бачать лише психологи спілки.</P>
        {BOOKING ? (
          <Button
            title="Записатися на сайті"
            kind="secondary"
            onPress={() => Linking.openURL(BOOKING)}
          />
        ) : (
          <P soft>Запис відкриється на сайті спілки, щойно він запрацює.</P>
        )}
      </Card>
      <Card>
        <H2>Заспокоїтися зараз</H2>
        <P>Коротка вправа на дихання, 2 хвилини.</P>
        <Button title="Почати" kind="secondary" onPress={() => router.push('/breathing')} />
      </Card>
      <P soft>
        Безоплатно можна звернутися й до свого сімейного лікаря. Самодопомога й мапа служб:
        howareu.com.
      </P>
    </Screen>
  )
}
