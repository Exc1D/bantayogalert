import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UIState {
  isDrawerOpen: boolean
  activePanel: string | null
  mapViewport: { center: [number, number]; zoom: number }
  selectedReportId: string | null
  activeFilters: {
    reportTypes: string[]
    severities: string[]
    municipalities: string[]
    statuses: string[]
  }
  openDrawer: (panel: string) => void
  closeDrawer: () => void
  setMapViewport: (viewport: UIState['mapViewport']) => void
  selectReport: (reportId: string | null) => void
  setFilters: (filters: Partial<UIState['activeFilters']>) => void
  resetFilters: () => void
}

const defaultFilters = {
  reportTypes: [] as string[],
  severities: [] as string[],
  municipalities: [] as string[],
  statuses: [] as string[],
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        isDrawerOpen: false,
        activePanel: null,
        mapViewport: { center: [14.13, 122.95], zoom: 10 },
        selectedReportId: null,
        activeFilters: defaultFilters,
        openDrawer: (panel) => set({ isDrawerOpen: true, activePanel: panel }),
        closeDrawer: () => set({ isDrawerOpen: false, activePanel: null }),
        setMapViewport: (viewport) => set({ mapViewport: viewport }),
        selectReport: (reportId) => set({ selectedReportId: reportId }),
        setFilters: (filters) =>
          set((state) => ({ activeFilters: { ...state.activeFilters, ...filters } })),
        resetFilters: () => set({ activeFilters: defaultFilters }),
      }),
      { name: 'bantayog-ui-store' }
    ),
    { name: 'UIStore' }
  )
)
