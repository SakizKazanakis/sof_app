import * as Notifications from 'expo-notifications'
import { router, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

import { AppProvider } from '@/lib/app'
import { colors } from '@/lib/theme'

function useNotificationTaps() {
  const last = Notifications.useLastNotificationResponse()
  useEffect(() => {
    const url = last?.notification.request.content.data?.url
    if (
      typeof url === 'string' &&
      last?.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      router.push(url as never)
      Notifications.clearLastNotificationResponse()
    }
  }, [last])
}

const loading = (
  <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
    <ActivityIndicator color={colors.text} />
  </View>
)

export default function RootLayout() {
  return (
    <AppProvider fallback={loading}>
      <StatusBar style="light" />
      <Routes />
    </AppProvider>
  )
}

function Routes() {
  useNotificationTaps()
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
        headerBackTitle: 'Назад',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="checkin" options={{ title: 'Ранкова відмітка', presentation: 'modal' }} />
      <Stack.Screen name="med" options={{ title: 'Ліки' }} />
      <Stack.Screen name="breathing" options={{ title: 'Дихання' }} />
      <Stack.Screen name="settings" options={{ title: 'Налаштування' }} />
    </Stack>
  )
}
