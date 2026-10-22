import type { ReactNode } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'

import { colors, space } from '@/lib/theme'

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: space.md, gap: space.md, paddingBottom: space.xl }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  )
}

export function Card({ children, tone }: { children: ReactNode; tone?: 'urgent' | 'warn' }) {
  return (
    <View
      style={[
        s.card,
        tone === 'urgent' && { borderColor: colors.accent, borderLeftWidth: 4 },
        tone === 'warn' && { borderColor: colors.warn, borderLeftWidth: 4 },
      ]}
    >
      {children}
    </View>
  )
}

export const H1 = ({ children }: { children: ReactNode }) => <Text style={s.h1}>{children}</Text>
export const H2 = ({ children }: { children: ReactNode }) => <Text style={s.h2}>{children}</Text>
export const P = ({ children, soft }: { children: ReactNode; soft?: boolean }) => (
  <Text style={[s.p, soft && { color: colors.soft, fontSize: 14 }]}>{children}</Text>
)

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
}: {
  title: string
  onPress: () => void
  kind?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        kind === 'primary' && { backgroundColor: colors.accent, borderColor: colors.accent },
        kind === 'danger' && { borderColor: colors.accent },
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={[s.buttonText, kind === 'danger' && { color: colors.accent }]}>{title}</Text>
    </Pressable>
  )
}

/** Шкала з п'яти кнопок; підписи крайніх значень пояснюють, що означає 1 і 5. */
export function Scale({
  label,
  value,
  onChange,
  low,
  high,
}: {
  label: string
  value: number | null
  onChange: (v: number) => void
  low: string
  high: string
}) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={s.label}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: space.xs }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === n }}
            accessibilityLabel={`${label}: ${n} з 5`}
            onPress={() => onChange(n)}
            style={[s.scaleItem, value === n && s.scaleOn]}
          >
            <Text style={[s.scaleText, value === n && { color: colors.bg }]}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={s.hint}>{low}</Text>
        <Text style={s.hint}>{high}</Text>
      </View>
    </View>
  )
}

export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={s.label}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === o.value }}
            onPress={() => onChange(o.value)}
            style={[s.chip, value === o.value && s.scaleOn]}
          >
            <Text style={[s.scaleText, value === o.value && { color: colors.bg }]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

export function Field({
  label,
  hint,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.soft} style={s.input} {...props} />
      {hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    padding: space.md,
    gap: space.sm,
  },
  h1: { color: colors.text, fontSize: 26, fontWeight: '700' },
  h2: { color: colors.text, fontSize: 18, fontWeight: '700' },
  p: { color: colors.text, fontSize: 16, lineHeight: 23 },
  label: { color: colors.text, fontSize: 15, fontWeight: '600' },
  hint: { color: colors.soft, fontSize: 13 },
  button: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: space.md,
    alignItems: 'center',
  },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  scaleItem: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  scaleOn: { backgroundColor: colors.calm, borderColor: colors.calm },
  scaleText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    backgroundColor: colors.surface2,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
})
