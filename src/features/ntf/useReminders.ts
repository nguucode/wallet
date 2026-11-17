import { useEffect } from 'react'
import { mutate, now, useSettings, useWorld } from '@/app/store'
import { dueReminders } from './reminders'

/**
 * Adds missing reminders on mount and after each clock or data change. Idempotent by id.
 * shortcut: runs only while Home or Notifications is mounted; move into the store's hydrate/advanceClock if reminders must appear on other screens.
 */
export function useReminders() {
  const w = useWorld()
  const offset = useSettings().clockOffsetMs
  useEffect(() => {
    try {
      const add = dueReminders(w, now())
      if (add.length) mutate((d) => { for (const n of add) if (!d.notifications.some((x) => x.id === n.id)) d.notifications.unshift(n) })
    } catch (e) {
      console.warn('Reminder skipped', e) // US-NTF-004: never blocks app load
    }
  }, [w, offset])
}
