'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@lib/supabaseClient'
import TimeSlots from './TimeSlots'

export default function BookingForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [service, setService] = useState('Haare')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [availableDates, setAvailableDates] = useState<string[]>([])

const getServicePrice = (s: string) => {
  switch (s) {
    case 'Haare':
      return 'CHF 30.–'
    case 'Bart':
      return 'CHF 20.–'
    case 'Haare & Bart':
      return 'CHF 45.–'
    default:
      return ''
  }
}


  useEffect(() => {
    const fetchDates = async () => {
      const today = new Date().toISOString().split('T')[0]
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
      }
    }

    fetchDates()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // ❗ Verhindert versehentliches Absenden, z. B. beim Doppelklick
  if (!name || !phone || !service || !date || !time) {
    console.log('⛔ handleSubmit abgebrochen – Felder unvollständig.')
    return
  }

    setLoading(true)


    const { data: slotCheck, error: slotCheckError } = await supabase
  .from('slots')
  .select('is_booked')
  .eq('date', date)
  .eq('start_time', time)
  .single()

if (slotCheckError || slotCheck?.is_booked) {
  setLoading(false)
  return alert('❌ Dieser Slot ist leider schon vergeben. Bitte wähle einen anderen.')
}


    const { data: appointmentData, error: appointmentError } = await supabase
      .from('appointments')
      .insert([
        {
          name,
          phone,
          service,
          date,
          start_time: time,
          duration: service === 'Haare & Bart' ? 60 : 30,
          status: 'gebucht',
        },
      ])
      .select()
      .single()

    if (appointmentError || !appointmentData) {
      setLoading(false)
      return alert('❌ Fehler beim Buchen: ' + appointmentError?.message)
    }

    const { error: slotError } = await supabase
      .from('slots')
      .update({
        is_booked: true,
        appointment_id: appointmentData.id,
      })
      .eq('date', date)
      .eq('start_time', time)

    setLoading(false)

    if (slotError) {
      alert('❌ Slot-Update-Fehler: ' + slotError.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
  const formattedDate = new Date(date).toLocaleDateString('de-CH') // z.B. 31.07.2025

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-sm text-center space-y-6 p-6 bg-gray-900 rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold text-green-400">✅ Termin gebucht!</h2>

        <div className="space-y-1">
          <p className="text-base">Dein Termin ist am</p>
          <p className="text-2xl font-bold text-white">{formattedDate}</p>
          <p className="text-4xl font-extrabold text-pink-500">{time} Uhr</p>
          <p className="text-lg font-semibold text-white">
  {service} – <span className="text-gray-300">{getServicePrice(service)}</span> </p>
        </div>

        <div className="text-sm text-gray-400 mt-4">
          Bitte erscheine pünktlich – bezahlt wird bar vor Ort 
        </div>

        <div className="text-sm text-gray-300">
          📍 Rossgassmoos 7, 6130 Willisau
        </div>

        <div className="flex justify-center gap-4 pt-2">
          <a
            href="https://www.google.com/maps?q=Rossgassmoos+7,+6130+Willisau"
            target="_blank"
            className="underline text-blue-400"
          >
            Google Maps
          </a>
          <a
            href="http://maps.apple.com/?address=Rossgassmoos+7,+6130+Willisau"
            target="_blank"
            className="underline text-blue-400"
          >
            Apple Karten
          </a>
        </div>
      </div>
    </div>
  )
}


  return (
  <div className="min-h-screen bg-black text-white px-4 py-10">
    <div className="w-full max-w-xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-black p-6 rounded-xl shadow-lg space-y-4"
      >
        <div className="text-center">
          <img src="/logo.png" alt="Logo" className="h-10 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-[#FC02BF]">Termin buchen</h1>
        </div>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FC02BF]"
          required
        />
        <input
          type="tel"
          placeholder="Telefonnummer"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FC02BF]"
          required
        />
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full p-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FC02BF]"
        >
          <option value="Haare">Haare – CHF 30.-</option>
          <option value="Bart">Bart – CHF 15.-</option>
          <option value="Haare & Bart">Haare & Bart – CHF 45.-</option>
        </select>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {availableDates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDate(d)}
              className={`px-4 py-2 rounded-full whitespace-nowrap border ${
                date === d
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              {new Date(d).toLocaleDateString('de-CH', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
              })}
            </button>
          ))}
        </div>

        {date && (
          <div className="space-y-2">
            <label className="block font-medium text-sm">Uhrzeit wählen:</label>
            <TimeSlots date={date} selectedTime={time} onSelect={setTime} />
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-[#FC02BF] text-white font-semibold text-lg py-3 rounded-lg hover:bg-pink-600 transition disabled:opacity-50"
          disabled={loading || !time}
        >
          {loading ? 'Bucht...' : 'Termin buchen'}
        </button>
      </form>
    </div>
  </div>
)
}
