import * as Notifications from 'expo-notifications'
import { AndroidImportance } from 'expo-notifications'
import { Platform } from 'react-native'

import { parseTime } from './dates'
import type { Med, Profile } from './types'

const CHANNEL = 'reminders'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function ensurePermission() {
  if (Platform.OS === 'android') {
    // На Android 13+ запит дозволу з'являється лише після створення каналу.
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Нагадування',
      importance: AndroidImportance.HIGH,
    })
  }
  const current = await Notifications.getPermissionsAsync()
  if (current.granted) return true
  const asked = await Notifications.requestPermissionsAsync()
  return asked.granted
}

const daily = (hour: number, minute: number): Notifications.NotificationTriggerInput => ({
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  hour,
  minute,
  channelId: CHANNEL,
})

/**
 * Перепланувати всі нагадування з нуля: ранкову відмітку і кожен прийом ліків.
 * Простіше й надійніше, ніж відстежувати окремі ідентифікатори. Текст сповіщення не містить
 * назв ліків: його видно на заблокованому екрані.
 */
export async function reschedule(profile: Profile, meds: Med[]) {
  await Notifications.cancelAllScheduledNotificationsAsync()
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Доброго ранку, ${profile.name}`,
      body: 'Як спалося? Дві хвилини на ранкову відмітку.',
      data: { url: '/checkin' },
    },
    trigger: daily(profile.checkinHour, profile.checkinMinute),
  })
  const times = new Set(meds.filter((m) => m.active).flatMap((m) => m.times))
  for (const t of times) {
    const parsed = parseTime(t)
    if (!parsed) continue
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Час прийому',
        body: 'Відмітьте, що прийняли ліки.',
        data: { url: '/meds' },
      },
      trigger: daily(parsed.hour, parsed.minute),
    })
  }
}
