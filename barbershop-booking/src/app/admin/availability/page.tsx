'use client'

import { useEffect, useState } from 'react'
import { supabase } from 'lib/supabaseClient'
import { format, parseISO } from 'date-fns'
import AdminNavbar from 'src/app/components/AdminNavbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { generateTimeSlots } from '@/lib/slotGenerator'
import Link from 'next/link'

type Availability = {
  id: string
  date: string
  start_time: string
  end_time: string
}

export default function AdminAvailabilityPage() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([])

  const [showForm, setShowForm] = useState(false)
  const [availDate, setAvailDate] = useState('')
  const [availStart, setAvailStart] = useState('')
  const [availEnd, setAvailEnd] = useState('')

  // 📦 Verfügbarkeiten laden
  const fetchAvailabilities = async () => {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (!error && data) setAvailabilities(data)
  }

  useEffect(() => {
    fetchAvailabilities()
  }, [])

  const handleDelete = async (id: string) => {
    const confirm = window.confirm(
      '❗ Diese Verfügbarkeit wirklich löschen? Alle zugehörigen Slots bleiben erhalten.'
    )
    if (!confirm) return

    const { error } = await supabase.from('availability').delete().eq('id', id)
    if (error) {
      return alert('❌ Fehler beim Löschen: ' + error.message)
    }

    setAvailabilities((prev) => prev.filter((a) => a.id !== id))
    alert('✅ Verfügbarkeit gelöscht.')
  }

  const handleCreateAvailability = async () => {
    if (!availDate || !availStart || !availEnd) {
      return alert('Bitte alle Felder ausfüllen')
    }

    const { data: availability, error } = await supabase
      .from('availability')
      .insert([{ date: availDate, start_time: availStart, end_time: availEnd }])
      .select()
      .single()

    if (error || !availability) {
      return alert('Fehler beim Speichern: ' + error?.message)
    }

    const slotEntries = generateTimeSlots(availStart, availEnd).map((slot) => ({
      availability_id: availability.id,
      date: availDate,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_booked: false,
      appointment_id: null,
    }))

    const { error: slotError } = await supabase.from('slots').insert(slotEntries)

    if (slotError) {
      return alert('Fehler beim Slot-Generieren: ' + slotError.message)
    }

    alert('✅ Verfügbarkeit + Slots gespeichert!')
    setAvailDate('')
    setAvailStart('')
    setAvailEnd('')
    setShowForm(false)
    fetchAvailabilities()
  }

  return (
    <>
      <AdminNavbar />

      <div className="mt-4" />

      {!showForm && (
        <Button
          className="w-full bg-[#FC02BF] hover:bg-pink-600 mb-4"
          onClick={() => setShowForm(true)}
        >
          Neue Verfügbarkeit
        </Button>
      )}

      {showForm && (
        <div className="bg-gray-800 p-3 rounded-md space-y-2 mb-4">
          <Input
            type="date"
            value={availDate}
            onChange={(e) => setAvailDate(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="time"
              value={availStart}
              onChange={(e) => setAvailStart(e.target.value)}
            />
            <Input
              type="time"
              value={availEnd}
              onChange={(e) => setAvailEnd(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleCreateAvailability}
            >
              Speichern
            </Button>
            <Button
              type="button"
              className="bg-gray-700 hover:bg-gray-600"
              onClick={() => {
                setShowForm(false)
                setAvailDate('')
                setAvailStart('')
                setAvailEnd('')
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {availabilities.length === 0 ? (
        <p className="text-center text-gray-500">Keine Verfügbarkeiten gefunden.</p>
      ) : (
        <ul className="space-y-3">
          {availabilities.map((a) => (
            <li
              key={a.id}
              className="p-4 bg-gray-900 rounded-xl border border-gray-700"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-mono text-sm text-gray-400">
                    {format(parseISO(a.date), 'dd.MM.yyyy')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {a.start_time} – {a.end_time}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
                >
                  Löschen
                </button>
              </div>
            </li>
          ))}
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
