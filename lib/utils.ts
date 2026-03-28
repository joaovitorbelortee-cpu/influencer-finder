import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

export function getEngagementLabel(rate: number): { label: string; color: string } {
  if (rate > 6) return { label: "Excelente", color: "green" }
  if (rate >= 3) return { label: "Bom", color: "yellow" }
  if (rate >= 1) return { label: "Médio", color: "orange" }
  return { label: "Baixo", color: "red" }
}

export function getTierLabel(tier: string): string {
  const map: Record<string, string> = { MICRO: "Micro", MID: "Mid", MACRO: "Macro" }
  return map[tier] || tier
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}
