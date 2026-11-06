import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { usePreviewScreens } from '@/utils/demo/demoMode'

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

// What the app acts on. The backend has no Premium data, so a build that talks to it always has access (the AI Concierge
// works for everyone); the simulated status only applies to demo and preview builds, where the Premium screen can change it.
export const usePremiumStatus = (): PremiumStatus => {
  const simulated = usePreviewScreens()
  const status = usePremiumStore((state) => state.status)
  return simulated ? status : 'active'
}

// Active and ending soon both keep access to the Premium features
export const hasPremiumAccess = (status: PremiumStatus) => status !== 'inactive'
