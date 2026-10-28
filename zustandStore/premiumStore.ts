import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Premium access comes from the patient's clinic or provider. There is no API for it yet,
// so this prototype keeps a simulated status on the device (changed from the Premium screen).
export type PremiumStatus = 'active' | 'expiring' | 'inactive'

interface PremiumStore {
  status: PremiumStatus
  setStatus: (status: PremiumStatus) => void
}

export const usePremiumStore = create<PremiumStore>()(
  persist(
    (set) => ({
      status: 'active',
      setStatus: (status) => set({ status }),
    }),
    {
      name: 'premium-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

// Active and ending soon both keep access to the Premium features
export const hasPremiumAccess = (status: PremiumStatus) => status !== 'inactive'
