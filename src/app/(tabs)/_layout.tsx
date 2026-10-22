import { Redirect } from 'expo-router'
import { Tabs } from 'expo-router/js-tabs'
import { Text, type ColorValue } from 'react-native'

import { useApp } from '@/lib/app'
import { colors } from '@/lib/theme'

const icon = (glyph: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>
  }

export default function TabsLayout() {
  const { profile } = useApp()
  if (!profile) return <Redirect href="/onboarding" />
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.soft,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Сьогодні', tabBarIcon: icon('☀') }} />
      <Tabs.Screen name="trends" options={{ title: 'Динаміка', tabBarIcon: icon('▤') }} />
      <Tabs.Screen name="meds" options={{ title: 'Ліки', tabBarIcon: icon('✚') }} />
      <Tabs.Screen name="help" options={{ title: 'Допомога', tabBarIcon: icon('☎') }} />
    </Tabs>
  )
}
