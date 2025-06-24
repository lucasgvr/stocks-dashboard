import type { CorporateEvent } from "./corporate-events"

const EVENTS_STORAGE_KEY = "portfolio-corporate-events"

export interface LocalCorporateEvent extends CorporateEvent {}

export function saveCorporateEventsLocal(events: LocalCorporateEvent[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
  }
}

export function getCorporateEventsLocal(): LocalCorporateEvent[] {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(EVENTS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  }
  return []
}

export function createCorporateEventLocal(
  event: Omit<LocalCorporateEvent, "id" | "created_at" | "updated_at" | "processed">,
): LocalCorporateEvent {
  const newEvent: LocalCorporateEvent = {
    ...event,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    processed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const events = getCorporateEventsLocal()
  events.unshift(newEvent)
  saveCorporateEventsLocal(events)

  return newEvent
}

export function updateCorporateEventLocal(id: string, updates: Partial<LocalCorporateEvent>): LocalCorporateEvent {
  const events = getCorporateEventsLocal()
  const index = events.findIndex((e) => e.id === id)

  if (index !== -1) {
    events[index] = {
      ...events[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    saveCorporateEventsLocal(events)
    return events[index]
  }

  throw new Error("Evento corporativo não encontrado")
}

export function deleteCorporateEventLocal(id: string) {
  const events = getCorporateEventsLocal()
  const filtered = events.filter((e) => e.id !== id)
  saveCorporateEventsLocal(filtered)
}

export function getCorporateEventsBySymbolLocal(symbol: string): LocalCorporateEvent[] {
  return getCorporateEventsLocal().filter((e) => e.symbol === symbol)
}
