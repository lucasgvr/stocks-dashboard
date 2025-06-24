// Utilitários para lidar com datas sem problemas de timezone

/**
 * Converte uma data para string no formato YYYY-MM-DD sem problemas de timezone
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Obtém a data atual no formato YYYY-MM-DD (timezone local)
 */
export function getCurrentDateString(): string {
  return formatDateToString(new Date())
}

/**
 * Converte string YYYY-MM-DD para Date sem problemas de timezone
 * Força a interpretação como data local, não UTC
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day) // month é 0-indexed
}

/**
 * Valida se uma string está no formato YYYY-MM-DD
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false

  const date = parseLocalDate(dateString)
  return !isNaN(date.getTime()) && formatDateToString(date) === dateString
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
export function formatDateForDisplay(dateString: string): string {
  try {
    const date = parseLocalDate(dateString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

/**
 * Converte data de DD/MM/YYYY para YYYY-MM-DD
 */
export function convertDisplayDateToString(displayDate: string): string {
  const [day, month, year] = displayDate.split("/").map(Number)
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}
