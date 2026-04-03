import { create } from 'zustand'
import { IncidentType, Severity } from '@/types/report'

export interface DateRange {
  from: Date | null
  to: Date | null
}

export interface FilterState {
  type: IncidentType | null
  severity: Severity | null
  municipalityCode: string | null
  dateRange: DateRange
  setType: (type: IncidentType | null) => void
  setSeverity: (severity: Severity | null) => void
  setMunicipality: (code: string | null) => void
  setDateRange: (range: DateRange) => void
  clearFilters: () => void
}

const initialState = {
  type: null,
  severity: null,
  municipalityCode: null,
  dateRange: { from: null, to: null } as DateRange,
}

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  setType: (type) => set({ type }),
  setSeverity: (severity) => set({ severity }),
  setMunicipality: (municipalityCode) => set({ municipalityCode }),
  setDateRange: (dateRange) => set({ dateRange }),
  clearFilters: () => set(initialState),
}))
