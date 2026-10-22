import { useEffect, useState } from 'react'
import { Animated, Easing, Text, View } from 'react-native'

import { Button, P, Screen } from '@/components/ui'
import { colors } from '@/lib/theme'

const IN = 4000
const OUT = 6000
const ROUNDS = 12

/** Дихання 4–6: вдих 4 секунди, видих 6. Подовжений видих допомагає знизити напругу. */
export default function Breathing() {
  const [scale] = useState(() => new Animated.Value(0.6))
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!running) return
    let cancelled = false
    const cycle = (n: number) => {
      if (cancelled || n >= ROUNDS) return setRunning(false)
      setRound(n + 1)
      setPhase('in')
      Animated.timing(scale, {
        toValue: 1,
        duration: IN,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (cancelled) return
        setPhase('out')
        Animated.timing(scale, {
          toValue: 0.6,
          duration: OUT,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start(() => cycle(n + 1))
      })
    }
    cycle(0)
    return () => {
      cancelled = true
      scale.stopAnimation()
    }
  }, [running, scale])

  return (
    <Screen>
      <P>
        Сядьте зручно. Вдихайте носом, поки коло росте, і повільно видихайте, поки воно зменшується.
      </P>
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 280 }}>
        <Animated.View
          style={{
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: colors.calm,
            opacity: 0.35,
            transform: [{ scale }],
            position: 'absolute',
          }}
        />
        <Text
          style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}
          accessibilityLiveRegion="polite"
        >
          {running ? (phase === 'in' ? 'Вдих' : 'Видих') : 'Готові?'}
        </Text>
        {running && (
          <Text style={{ color: colors.soft, marginTop: 8 }}>
            {round} з {ROUNDS}
          </Text>
        )}
      </View>
      <Button
        title={running ? 'Зупинити' : 'Почати'}
        kind={running ? 'secondary' : 'primary'}
        onPress={() => setRunning(!running)}
      />
    </Screen>
  )
}
