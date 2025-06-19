import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type WaterUnit = 'ml' | 'fl.oz'
export type WeightUnit = 'kg' | 'lbs'

interface UnitStore {
  waterUnit: WaterUnit
  weightUnit: WeightUnit
  setWaterUnit: (unit: WaterUnit) => void
  setWeightUnit: (unit: WeightUnit) => void
}

export const useUnitStore = create<UnitStore>()(
  persist(
    (set) => ({
      waterUnit: 'ml',
      weightUnit: 'kg',
      setWaterUnit: (unit) => set({ waterUnit: unit }),
      setWeightUnit: (unit) => set({ weightUnit: unit }),
    }),
    {
      name: 'unit-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

// Water conversion utilities
export const convertMlToFlOz = (ml: number): number => {
  return ml * 0.033814; // 1 ml = 0.033814 fl oz
}

export const convertFlOzToMl = (flOz: number): number => {
  return flOz * 29.5735; // 1 fl oz = 29.5735 ml
}

export const formatWaterAmount = (ml: number, unit: WaterUnit): string => {
  if (unit === 'fl.oz') {
    const flOz = convertMlToFlOz(ml);
    return `${flOz.toFixed(1)} fl oz`;
  } else {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(2)}L`;
    } else {
      return `${ml}ml`;
    }
  }
}

export const formatWaterAmountForChart = (ml: number, unit: WaterUnit): number => {
  if (unit === 'fl.oz') {
    return convertMlToFlOz(ml);
  } else {
    return ml / 1000; // Convert to liters for chart
  }
}

// Weight conversion utilities
export const convertKgToLbs = (kg: number): number => {
  return kg * 2.20462; // 1 kg = 2.20462 lbs
}

export const convertLbsToKg = (lbs: number): number => {
  return lbs / 2.20462; // 1 lbs = 0.453592 kg
}

export const convertWeight = (weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
  if (fromUnit === toUnit) return weight;

  if (fromUnit === "kg" && toUnit === "lbs") {
    return convertKgToLbs(weight);
  } else if (fromUnit === "lbs" && toUnit === "kg") {
    return convertLbsToKg(weight);
  }

  return weight; // Default case
}

export const formatWeightAmount = (weight: number, unit: WeightUnit): string => {
  return `${weight.toFixed(1)} ${unit}`;
} 