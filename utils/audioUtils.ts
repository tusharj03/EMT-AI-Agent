import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Convert audio duration in milliseconds to formatted time string (MM:SS)
export const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Format timestamp in seconds to MM:SS format
export const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Get file info from URI
export const getFileInfo = async (fileUri: string) => {
  try {
    if (Platform.OS === 'web') {
      // Web doesn't support FileSystem.getInfoAsync
      return { exists: true, size: 0, uri: fileUri };
    }
    
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    return fileInfo;
  } catch (error) {
    console.error('Error getting file info:', error);
    return { exists: false, size: 0, uri: fileUri };
  }
};

// Convert base64 to blob for web
export const base64ToBlob = (base64: string, mimeType: string) => {
  if (Platform.OS !== 'web') return null;
  
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: mimeType });
};