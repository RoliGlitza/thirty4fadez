// src/lib/slotGenerator.ts
import { addMinutes, isBefore } from 'date-fns'

export function generateTimeSlots(start: string, end: string, interval = 45) {
  const slots: { start_time: string; end_time: string }[] = []
  let current = new Date(`1970-01-01T${start}`)
  const endDate = new Date(`1970-01-01T${end}`)

  while (isBefore(current, endDate)) {
    const next = addMinutes(current, interval)
    slots.push({
      start_time: current.toTimeString().slice(0, 5),
      end_time: next.toTimeString().slice(0, 5),
    })
    current = next
  }

  return slots
}
