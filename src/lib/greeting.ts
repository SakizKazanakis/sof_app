export const greeting = (name: string, now: Date = new Date()) => {
  const h = now.getHours()
  const part =
    h >= 5 && h < 12 ? 'Доброго ранку' : h >= 12 && h < 18 ? 'Добрий день' : 'Добрий вечір'
  return name.trim() ? `${part}, ${name.trim()}` : part
}
