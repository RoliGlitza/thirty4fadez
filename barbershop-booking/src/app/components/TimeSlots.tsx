'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@lib/supabaseClient'

type Props = {
  date: string
  selectedTime: string
  onSelect: (time: string) => void
}

export default function TimeSlots({ date, selectedTime, onSelect }: Props) {
  const [availableTimes, setAvailableTimes] = useState<string[]>([])

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      const { data, error } = await supabase
        .from('slots')
        .select('start_time')
        .eq('date', date)
        .eq('is_booked', false)

      if (!error && data) {
        const times = Array.from(
  new Set(
    data
      .map((slot) => slot.start_time.slice(0, 5))
      .sort((a, b) => a.localeCompare(b)) // Uhrzeit sortieren
  )
)
setAvailableTimes(times)

      }
    }

    if (date) fetchAvailableSlots()
  }, [date])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
  {availableTimes.map((slot) => {
    const isSelected = slot === selectedTime

    return (
      <button
  type="button"

        key={slot}
        onClick={() => onSelect(slot)}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
          isSelected
            ? 'bg-pink-600 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-pink-500 hover:text-white'
        }`}
      >
        {slot} Uhr
      </button>
    )
  })}
</div>

  )
}
