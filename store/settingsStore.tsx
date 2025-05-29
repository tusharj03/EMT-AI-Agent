import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  autoTranscribe: boolean;
  autoGenerateReport: boolean;
  defaultRecordingTitle: string;
  organizationName: string;
  providerName: string;
  providerID: string;
  
  // Actions
  toggleAutoTranscribe: () => void;
  toggleAutoGenerateReport: () => void;
  setDefaultRecordingTitle: (title: string) => void;
  setOrganizationName: (name: string) => void;
  setProviderName: (name: string) => void;
  setProviderID: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoTranscribe: true,
      autoGenerateReport: true,
      defaultRecordingTitle: 'Patient Encounter',
      organizationName: '',
      providerName: '',
      providerID: '',
      
      toggleAutoTranscribe: () => set((state) => ({ 
        autoTranscribe: !state.autoTranscribe 
      })),
      
      toggleAutoGenerateReport: () => set((state) => ({ 
        autoGenerateReport: !state.autoGenerateReport 
      })),
      
      setDefaultRecordingTitle: (title) => set({ 
        defaultRecordingTitle: title 
      }),
      
      setOrganizationName: (name) => set({ 
        organizationName: name 
      }),
      
      setProviderName: (name) => set({ 
        providerName: name 
      }),
      
      setProviderID: (id) => set({ 
        providerID: id 
      }),
    }),
    {
      name: 'emt-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);