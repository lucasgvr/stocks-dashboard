import { supabase } from "./supabase"
import type { CorporateEvent } from "./corporate-events"

export async function createCorporateEvent(
  event: Omit<CorporateEvent, "id" | "created_at" | "updated_at" | "processed">,
): Promise<CorporateEvent> {
  try {
    const { data, error } = await supabase
      .from("corporate_events")
      .insert([
        {
          ...event,
          processed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Erro ao criar evento corporativo:", error)
    throw error
  }
}

export async function getCorporateEvents(symbol?: string): Promise<CorporateEvent[]> {
  try {
    let query = supabase.from("corporate_events").select("*").order("event_date", { ascending: false })

    if (symbol) {
      query = query.eq("symbol", symbol)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Erro ao buscar eventos corporativos:", error)
    throw error
  }
}

export async function updateCorporateEvent(id: string, updates: Partial<CorporateEvent>): Promise<CorporateEvent> {
  try {
    const { data, error } = await supabase
      .from("corporate_events")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Erro ao atualizar evento corporativo:", error)
    throw error
  }
}

export async function deleteCorporateEvent(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("corporate_events").delete().eq("id", id)

    if (error) throw error
  } catch (error) {
    console.error("Erro ao deletar evento corporativo:", error)
    throw error
  }
}

export async function markEventAsProcessed(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("corporate_events")
      .update({
        processed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error
  } catch (error) {
    console.error("Erro ao marcar evento como processado:", error)
    throw error
  }
}
