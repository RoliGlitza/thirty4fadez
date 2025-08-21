'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@lib/supabaseClient'
import { format } from 'date-fns'
import AdminNavbar from 'src/app/components/AdminNavbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ListIcon, GridIcon, UserCircle } from 'lucide-react'

type Appointment = {
  id: string
  name: string
  phone: string
  service: string
  date: string
  start_time: string
  appointment_slot_id?: string | null
}

export default function AdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [view, setView] = useState<'card' | 'list'>('card')
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Appointment>>({})

  useEffect(() => {
  const fetchAppointments = async () => {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (!error && data) {
      setAppointments(data)

      const uniqueDates = [...new Set(data.map((a) => a.date))].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      )

      setAvailableDates(uniqueDates)

      // ⏳ cleverer Standardwert: heute falls vorhanden, sonst nächstmöglich
      if (uniqueDates.includes(today)) {
        setSelectedDate(today)
      } else if (uniqueDates.length > 0) {
        setSelectedDate(uniqueDates[0])
      }
    }
  }

  fetchAppointments()
}, [])


  const filteredAppointments = selectedDate
    ? appointments.filter((a) => a.date === selectedDate)
    : appointments

  const handleEdit = (appt: Appointment) => {
    setEditId(appt.id)
    setFormData({ ...appt })
  }

  const handleCancel = () => {
    setEditId(null)
    setFormData({})
  }

  const handleSave = async () => {
    if (!editId || !formData.name || !formData.phone || !formData.service) return

    const { error } = await supabase
      .from('appointments')
      .update({
        name: formData.name,
        phone: formData.phone,
        service: formData.service
      })
      .eq('id', editId)

    if (error) {
      alert('❌ Fehler beim Speichern: ' + error.message)
      return
    }

    setAppointments((prev) =>
      prev.map((a) => (a.id === editId ? { ...a, ...formData } as Appointment : a))
    )
    setEditId(null)
    setFormData({})
    alert('✅ Änderungen gespeichert')
  }

  const handleDeleteAndFreeSlot = async (apptId: string) => {
    const confirm = window.confirm('❗ Termin wirklich löschen und Slot freigeben?')
    if (!confirm) return

    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', apptId)

    if (deleteError) return alert('❌ Fehler beim Löschen: ' + deleteError.message)

    const { error: slotUpdateError } = await supabase
      .from('slots')
      .update({ is_booked: false, appointment_id: null })
      .eq('appointment_id', apptId)

    if (slotUpdateError) {
      alert('❌ Termin gelöscht, aber Slot konnte nicht freigegeben werden.')
    } else {
      alert('✅ Termin gelöscht & Slot freigegeben.')
    }

    setAppointments((prev) => prev.filter((a) => a.id !== apptId))
    setEditId(null)
  }

  return (
    <>
      <AdminNavbar />
      <div className="mt-4" />

      <header className="sticky top-0 bg-black z-10 pb-4">
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex gap-2 justify-between items-center">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-gray-800 text-white rounded-md w-full"
            >
              <option value="">Alle Termine</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {format(new Date(d), 'dd.MM.yyyy')}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                variant={view === 'card' ? 'default' : 'ghost'}
                onClick={() => setView('card')}
                size="icon"
              >
                <GridIcon className="w-5 h-5" />
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                onClick={() => setView('list')}
                size="icon"
              >
                <ListIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {filteredAppointments.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">Keine Termine gefunden.</p>
      ) : view === 'list' ? (
        <ul className="mt-6 space-y-2">
          {filteredAppointments.map((appt) =>
            editId === appt.id ? (
              <li
                key={appt.id}
                className="p-4 border border-gray-700 rounded-xl bg-gray-800 space-y-2"
              >
                <Input
                  placeholder="Name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  placeholder="Telefon"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <select
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={formData.service || ''}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                >
                  <option value="Haare">Haare</option>
                  <option value="Bart">Bart</option>
                  <option value="Haare & Bart">Haare & Bart</option>
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
                    Speichern
                  </Button>
                  <Button className="bg-gray-700 hover:bg-gray-600" onClick={handleCancel}>
                    Abbrechen
                  </Button>
                </div>

                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-sm"
                  onClick={() => handleDeleteAndFreeSlot(appt.id)}
                >
                  Termin löschen & Slot freigeben
                </Button>
              </li>
            ) : (
              <li
  key={appt.id}
  className="p-3 bg-gray-800 rounded-xl flex justify-between items-center"
>
  {/* Linke Seite: Icon + Name */}
  <div className="flex items-center gap-3">
    <UserCircle className="w-6 h-6 text-white" />
    <span className="text-white font-medium">{appt.name}</span>
  </div>

  {/* Rechte Seite: Uhrzeit + Button */}
  <div className="flex items-center gap-3">
    <div className="text-sm font-mono text-gray-300 w-14 text-right">
      {format(new Date(`${appt.date}T${appt.start_time}`), 'HH:mm')}
    </div>
    <Button
      variant="ghost"
      size="sm"
      className="text-xs px-2 py-1 border border-gray-600 text-white"
      onClick={() => handleEdit(appt)}
    >
      Bearbeiten
    </Button>
  </div>
</li>

            )
          )}
        </ul>
      ) : (
        <div className="space-y-4 mt-6">
          {filteredAppointments.map((appt) =>
            editId === appt.id ? (
              <div
                key={appt.id}
                className="p-4 border border-gray-700 rounded-xl bg-gray-800 space-y-2"
              >
                <Input
                  placeholder="Name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  placeholder="Telefon"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <select
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={formData.service || ''}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                >
                  <option value="Haare">Haare</option>
                  <option value="Bart">Bart</option>
                  <option value="Haare & Bart">Haare & Bart</option>
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
                    Speichern
                  </Button>
                  <Button className="bg-gray-700 hover:bg-gray-600" onClick={handleCancel}>
                    Abbrechen
                  </Button>
                </div>

                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-sm"
                  onClick={() => handleDeleteAndFreeSlot(appt.id)}
                >
                  Termin löschen & Slot freigeben
                </Button>
              </div>
            ) : (
              <div
                key={appt.id}
                className="p-4 border border-gray-700 rounded-xl bg-gray-900 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-7 h-7 text-white" />
                    <div>
                      <div className="text-white font-semibold">{appt.name}</div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold">
                          {format(new Date(`${appt.date}T${appt.start_time}`), 'HH:mm')}
                        </div>
                        <div className="text-xs text-gray-400">
                          {format(new Date(appt.date), 'dd.MM.yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <a
                      href={`tel:${appt.phone}`}
                      className="bg-white text-green-600 rounded-full px-3 py-2 text-lg font-bold"
                    >
                      📞
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-1 border border-gray-600 text-white"
                      onClick={() => handleEdit(appt)}
                    >
                      Bearbeiten
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-[#FC02BF] font-medium">{appt.service}</div>
              </div>
            )
          )}
        </div>
      )}
    </>
  )
}
