import { View } from 'react-native'
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg'

import { colors } from '@/lib/theme'

/** Стовпчики по днях; пропущений день — порожнє місце, а не нуль. */
export function Bars({
  values,
  labels,
  max,
  color = colors.calm,
  width = 320,
  height = 120,
}: {
  values: (number | null)[]
  labels: string[]
  max: number
  color?: string
  width?: number
  height?: number
}) {
  const chartH = height - 18
  const step = width / values.length
  const barW = Math.max(4, step * 0.6)
  return (
    <View
      accessible
      accessibilityLabel={values.map((v, i) => `${labels[i]}: ${v ?? 'немає'}`).join(', ')}
    >
      <Svg width={width} height={height}>
        <Line x1={0} x2={width} y1={chartH} y2={chartH} stroke={colors.line} strokeWidth={1} />
        {values.map((v, i) => {
          const x = i * step + (step - barW) / 2
          const h = v === null ? 0 : Math.max(2, (v / max) * (chartH - 4))
          return <Rect key={i} x={x} y={chartH - h} width={barW} height={h} rx={2} fill={color} />
        })}
        {labels.map((l, i) =>
          l ? (
            <SvgText
              key={i}
              x={i * step + step / 2}
              y={height - 3}
              fontSize={10}
              fill={colors.soft}
              textAnchor="middle"
            >
              {l}
            </SvgText>
          ) : null,
        )}
      </Svg>
    </View>
  )
}
