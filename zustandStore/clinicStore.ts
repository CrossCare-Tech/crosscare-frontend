import { create } from "zustand";

export type Clinic = { id: string; name: string; address: string; provider: string; patients: number };

// Prototype 4.2 / 4.3 sample clinics.
// ponytail: demo data kept in memory only. There is no clinic API yet; replace with the connected clinics of the account.
export const SAMPLE_CLINICS: Clinic[] = [
  { id: "riverside", name: "Riverside OB-GYN", address: "412 Riverside Ave, Suite 200", provider: "Dr. Alvarez", patients: 1204 },
  { id: "sunrise", name: "Sunrise Women's Health", address: "88 Sunrise Blvd, Suite 3", provider: "Dr. Okafor", patients: 860 },
];
// What a scan "finds" once the sample clinics are already connected
export const EXTRA_CLINIC: Clinic = {
  id: "lakeside",
  name: "Lakeside Family Care",
  address: "210 Lake St, Suite 4",
  provider: "Dr. Chen",
  patients: 640,
};

interface ClinicStore {
  joined: Clinic[];
  activeId: string | null;
  join: (clinic: Clinic) => void;
  setActive: (id: string) => void;
}

export const useClinicStore = create<ClinicStore>((set) => ({
  joined: [],
  activeId: null,
  join: (clinic) => set((s) => (s.joined.some((c) => c.id === clinic.id) ? s : { joined: [...s.joined, clinic] })),
  setActive: (id) => set({ activeId: id }),
}));
