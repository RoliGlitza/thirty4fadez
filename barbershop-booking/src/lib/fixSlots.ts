import { supabase } from 'lib/supabaseClient'

/**
 * Repariert Slots, die appointment_id: null haben aber is_booked: true
 * Diese Funktion sollte aufgerufen werden, wenn Slots nicht korrekt freigegeben wurden
 */
export async function fixOrphanedSlots() {
  try {
    // Finde alle Slots mit appointment_id: null aber is_booked: true
    const { data: orphanedSlots, error: fetchError } = await supabase
      .from('slots')
      .select('id, date, start_time, is_booked, appointment_id')
      .is('appointment_id', null)
      .eq('is_booked', true)

    if (fetchError) {
      console.error('❌ Fehler beim Laden der Slots:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!orphanedSlots || orphanedSlots.length === 0) {
      console.log('✅ Keine verwaisten Slots gefunden')
      return { success: true, fixed: 0 }
    }

    console.log(`🔧 ${orphanedSlots.length} verwaiste Slots gefunden:`, orphanedSlots)

    // Setze is_booked auf false für alle verwaisten Slots
    const { error: updateError } = await supabase
      .from('slots')
      .update({ is_booked: false })
      .is('appointment_id', null)
      .eq('is_booked', true)

    if (updateError) {
      console.error('❌ Fehler beim Reparieren der Slots:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log(`✅ ${orphanedSlots.length} Slots erfolgreich repariert`)
    return { success: true, fixed: orphanedSlots.length }

  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error)
    return { success: false, error: 'Unerwarteter Fehler' }
  }
}

/**
 * Überprüft die Konsistenz zwischen appointments und slots
 */
export async function checkSlotConsistency() {
  try {
    // Lade alle Termine
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, date, start_time')

    if (appointmentsError) {
      return { success: false, error: appointmentsError.message }
    }

    // Lade alle Slots
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('id, date, start_time, is_booked, appointment_id')

    if (slotsError) {
      return { success: false, error: slotsError.message }
    }

    const issues = []

    // Überprüfe jeden Termin
    for (const appointment of appointments || []) {
      const matchingSlot = slots?.find(slot => 
        slot.date === appointment.date && 
        slot.start_time === appointment.start_time
      )

      if (!matchingSlot) {
        issues.push(`Termin ${appointment.id} hat keinen passenden Slot`)
      } else if (matchingSlot.appointment_id !== appointment.id) {
        issues.push(`Slot ${matchingSlot.id} hat falsche appointment_id`)
      } else if (!matchingSlot.is_booked) {
        issues.push(`Slot ${matchingSlot.id} ist nicht als gebucht markiert`)
      }
    }

    // Überprüfe jeden Slot
    for (const slot of slots || []) {
      if (slot.is_booked && !slot.appointment_id) {
        issues.push(`Slot ${slot.id} ist als gebucht markiert aber hat keine appointment_id`)
      }
      if (!slot.is_booked && slot.appointment_id) {
        issues.push(`Slot ${slot.id} ist als frei markiert aber hat eine appointment_id`)
      }
    }

    return { 
      success: true, 
      issues,
      hasIssues: issues.length > 0
    }

  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
    return { success: false, error: 'Unerwarteter Fehler' }
  }
}
