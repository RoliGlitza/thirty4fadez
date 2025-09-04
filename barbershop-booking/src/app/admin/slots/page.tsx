'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@lib/supabaseClient'
import AdminNavbar from 'src/app/components/AdminNavbar'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { fixOrphanedSlots, checkSlotConsistency } from '@lib/fixSlots'


type Slot = {
  id: string
  date: string
  start_time: string
  end_time: string
  is_booked: boolean
  appointment_id: string | null
  appointment: {
    name: string
    service: string
  } | null
}

export default function AdminSlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableDates, setAvailableDates] = useState<string[]>([])

  // 🔁 Slot + Termin freigeben
  const releaseSlot = async (slot: Slot) => {
    if (!slot.appointment || !slot.appointment_id) {
      return alert('Kein Termin mit diesem Slot verknüpft.')
    }

    const confirm = window.confirm(
      `❗ Termin für ${slot.appointment.name} wirklich löschen & Slot freigeben?`
    )
    if (!confirm) return

    // 1. Termin löschen
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', slot.appointment_id)

    if (deleteError) {
      return alert('❌ Fehler beim Löschen des Termins: ' + deleteError.message)
    }

    // 2. Slot freigeben
    const { error: updateError } = await supabase
      .from('slots')
      .update({
        is_booked: false,
        appointment_id: null,
      })
      .eq('id', slot.id)

    if (updateError) {
      return alert('❌ Fehler beim Freigeben des Slots: ' + updateError.message)
    }

    // Debug: Überprüfen ob der Slot korrekt aktualisiert wurde
    console.log('✅ Slot freigegeben:', { slotId: slot.id, is_booked: false, appointment_id: null })

    alert('✅ Slot erfolgreich freigegeben & Termin gelöscht.')

    setSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id
          ? { ...s, is_booked: false, appointment: null, appointment_id: null }
          : s
      )
    )
  }

const deleteFreeSlot = async (slotId: string) => {
  const confirm = window.confirm('❗ Diesen freien Slot wirklich löschen?')
  if (!confirm) return

  const { error } = await supabase
    .from('slots')
    .delete()
    .eq('id', slotId)

  if (error) {
    alert('❌ Fehler beim Löschen: ' + error.message)
  } else {
    alert('🗑️ Slot gelöscht.')
    setSlots((prev) => prev.filter((s) => s.id !== slotId))
  }
}

const handleFixSlots = async () => {
  const confirm = window.confirm('🔧 Verwaiste Slots reparieren? Dies setzt alle Slots mit appointment_id: null auf is_booked: false.')
  if (!confirm) return

  const result = await fixOrphanedSlots()
  if (result.success) {
    alert(`✅ ${result.fixed} Slots erfolgreich repariert!`)
    // Slots neu laden
    if (selectedDate) {
      const { data, error } = await supabase
        .from('slots')
        .select(`
          *,
          appointment:appointment_id (name, service)
        `)
        .eq('date', selectedDate)
        .order('start_time', { ascending: true })

      if (!error && data) setSlots(data)
    }
  } else {
    alert(`❌ Fehler beim Reparieren: ${result.error}`)
  }
}

const handleCheckConsistency = async () => {
  const result = await checkSlotConsistency()
  if (result.success) {
    if (result.hasIssues) {
      alert(`⚠️ ${result.issues.length} Konsistenz-Probleme gefunden:\n\n${result.issues.join('\n')}`)
    } else {
      alert('✅ Alle Slots sind konsistent!')
    }
  } else {
    alert(`❌ Fehler beim Überprüfen: ${result.error}`)
  }
}


useEffect(() => {
  const fetchDates = async () => {
    const today = new Date().toISOString().split('T')[0] // ⏰ nur ab heute

    const { data, error } = await supabase
      .from('availability')
      .select('date')
      .gte('date', today)
      .order('date', { ascending: true })

    if (!error && data) {
      const unique = [...new Set(data.map((d) => d.date))].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      )
      setAvailableDates(unique)
      if (unique.length > 0) setSelectedDate(unique[0])
    }
  }

  fetchDates()
}, [])


  // 📦 Slots nach ausgewähltem Datum laden
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) return

      const { data, error } = await supabase
        .from('slots')
        .select(`
          *,
          appointment:appointment_id (name, service)
        `)
        .eq('date', selectedDate)
        .order('start_time', { ascending: true })

      if (!error && data) setSlots(data)
    }

    fetchSlots()
  }, [selectedDate])

  return (
    <>
      <AdminNavbar />

      <div className="mt-4" />

      {/* Slot-Reparatur Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleCheckConsistency}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg border border-gray-600 transition-colors"
        >
          🔍 Konsistenz prüfen
        </button>
        <button
          onClick={handleFixSlots}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg border border-gray-600 transition-colors"
        >
          🔧 Slots reparieren
        </button>
      </div>

      {availableDates.length > 0 ? (
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded bg-gray-800 text-white"
        >
          {availableDates.map((d) => (
            <option key={d} value={d}>
              {format(parseISO(d), 'dd.MM.yyyy')}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-center text-gray-500 mb-4">
          Keine verfügbaren Daten gefunden.
        </p>
      )}

      {slots.length === 0 ? (
        <p className="text-center text-gray-500">Keine Slots gefunden.</p>
      ) : (
        <ul className="space-y-3">
          {slots.map((slot) => {
            const date = format(new Date(slot.date), 'dd.MM.yyyy')
            return (
              <li
                key={slot.id}
                className={`p-4 rounded-xl ${
                  slot.is_booked ? 'bg-gray-800' : 'bg-gray-900'
                } border border-gray-700`}
              >
                <div className="flex justify-between items-center">
                  <div className="font-mono text-sm text-gray-400">{date}</div>
                  <div className="text-xs text-gray-400">
                    {slot.start_time} – {slot.end_time}
                  </div>
                </div>

                {slot.is_booked ? (
                  <div className="mt-2 space-y-1">
                    <p className="font-semibold text-green-400">
                      Gebucht: {slot.appointment?.name}
                    </p>
                    <p className="text-sm text-gray-300">
                      {slot.appointment?.service}
                    </p>
                    <button
                      onClick={() => releaseSlot(slot)}
                      className="mt-2 text-xs bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
                    >
                      Slot freigeben & Termin löschen
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between">
  <p className="text-sm text-gray-500">Frei</p>
  <button
    onClick={() => deleteFreeSlot(slot.id)}
    className="text-xs bg-gray-700 hover:bg-red-600 px-3 py-1 rounded text-white"
  >
    Slot löschen
  </button>
</div>

                )}
              </li>
            )
          })}
        </ul>
      )}

      <Link
        href="/admin"
        className="block mt-8 text-center text-[#FC02BF] hover:underline text-sm"
      >
        ← Zurück zur Admin-Übersicht
      </Link>
    </>
  )
}
