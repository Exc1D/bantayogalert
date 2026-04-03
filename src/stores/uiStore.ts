import { create } from 'zustand'

export type ActivePanel = 'report-detail' | 'contact-detail' | 'announcement-detail' | 'report-form' | 'settings' | null
export type ActiveTab = 'feed' | 'map' | 'report' | 'alerts' | 'profile'

interface UIState {
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  activePanel: ActivePanel
  setActivePanel: (panel: ActivePanel) => void
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  selectedReportId: string | null
  setSelectedReportId: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  drawerOpen: false,
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  activePanel: null,
  setActivePanel: (panel) =>
    set({ activePanel: panel, drawerOpen: panel !== null }),
  activeTab: 'feed',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedReportId: null,
  setSelectedReportId: (id) => set({ selectedReportId: id }),
}))
