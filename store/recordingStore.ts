import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording, Report } from '@/types';

interface RecordingState {
  recordings: Recording[];
  currentRecording: Recording | null;
  isRecording: boolean;
  recordingDuration: number;
  
  // Actions
  startRecording: (title: string) => void;
  stopRecording: () => void;
  updateRecordingDuration: (duration: number) => void;
  setRecordingStatus: (id: string, status: Recording['status']) => void;
  setTranscription: (id: string, transcription: string) => void;
  setReport: (id: string, report: Report) => void;
  deleteRecording: (id: string) => void;
  deleteAllRecordings: () => void;
  clearCurrentRecording: () => void;
}

export const useRecordingStore = create<RecordingState>()(
  persist(
    (set, get) => ({
      recordings: [],
      currentRecording: null,
      isRecording: false,
      recordingDuration: 0,
      
      startRecording: (title) => {
        const newRecording: Recording = {
          id: Date.now().toString(),
          title: title || `Recording ${get().recordings.length + 1}`,
          date: new Date().toISOString(),
          duration: 0,
          status: 'recording',
        };
        
        set({
          currentRecording: newRecording,
          isRecording: true,
          recordingDuration: 0,
        });
      },
      
      stopRecording: () => {
        const { currentRecording, recordings, recordingDuration } = get();
        
        if (currentRecording) {
          const updatedRecording = {
            ...currentRecording,
            duration: recordingDuration,
            status: 'processing' as const,
          };
          
          set({
            recordings: [updatedRecording, ...recordings],
            currentRecording: updatedRecording,
            isRecording: false,
          });
        }
      },
      
      updateRecordingDuration: (duration) => {
        set({ recordingDuration: duration });
      },
      
      setRecordingStatus: (id, status) => {
        set((state) => ({
          recordings: state.recordings.map((rec) => 
            rec.id === id ? { ...rec, status } : rec
          ),
          currentRecording: state.currentRecording?.id === id 
            ? { ...state.currentRecording, status } 
            : state.currentRecording,
        }));
      },
      
      setTranscription: (id, transcription) => {
        set((state) => ({
          recordings: state.recordings.map((rec) => 
            rec.id === id ? { ...rec, transcription } : rec
          ),
          currentRecording: state.currentRecording?.id === id 
            ? { ...state.currentRecording, transcription } 
            : state.currentRecording,
        }));
      },
      
      setReport: (id, report) => {
        set((state) => ({
          recordings: state.recordings.map((rec) => 
            rec.id === id ? { ...rec, report, status: 'completed' } : rec
          ),
          currentRecording: state.currentRecording?.id === id 
            ? { ...state.currentRecording, report, status: 'completed' } 
            : state.currentRecording,
        }));
      },
      
      deleteRecording: (id) => {
        set((state) => ({
          recordings: state.recordings.filter((rec) => rec.id !== id),
          currentRecording: state.currentRecording?.id === id 
            ? null 
            : state.currentRecording,
        }));
      },
      
      deleteAllRecordings: () => {
        set({
          recordings: [],
          currentRecording: null,
          isRecording: false,
          recordingDuration: 0,
        });
      },
      
      clearCurrentRecording: () => {
        set({ currentRecording: null });
      },
    }),
    {
      name: 'emt-recordings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);