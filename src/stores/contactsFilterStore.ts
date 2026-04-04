import { create } from 'zustand'
import { ContactType } from '@/types/contact'

export interface ContactsFilterState {
  searchQuery: string
  typeFilter: ContactType | null
  municipalityCode: string | null
  setSearchQuery: (query: string) => void
  setTypeFilter: (type: ContactType | null) => void
  setMunicipalityCode: (code: string | null) => void
  clearFilters: () => void
}

const initialState = {
  searchQuery: '',
  typeFilter: null,
  municipalityCode: null,
}

export const useContactsFilterStore = create<ContactsFilterState>((set) => ({
  ...initialState,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setMunicipalityCode: (municipalityCode) => set({ municipalityCode }),
  clearFilters: () => set(initialState),
}))