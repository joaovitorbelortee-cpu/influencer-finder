export function escapeCsvField(value: string | number | boolean | null | undefined) {
  const rawValue = String(value ?? "").replace(/\r?\n/g, " ")
  const safeValue = /^[=+\-@]/.test(rawValue) ? `'${rawValue}` : rawValue
  return `"${safeValue.replace(/"/g, '""')}"`
}
