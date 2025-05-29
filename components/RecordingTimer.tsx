import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { formatDuration } from '@/utils/audioUtils';

interface RecordingTimerProps {
  isRecording: boolean;
  onDurationUpdate?: (duration: number) => void;
}

export default function RecordingTimer({ 
  isRecording, 
  onDurationUpdate 
}: RecordingTimerProps) {
  const [duration, setDuration] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (isRecording) {
      // Start recording - set the start time
      startTimeRef.current = Date.now();
      setDuration(0);
      
      // Start the timer
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const newDuration = Date.now() - startTimeRef.current;
          setDuration(newDuration);
          if (onDurationUpdate) {
            onDurationUpdate(newDuration);
          }
        }
      }, 100);
    } else {
      // Stop recording - clear the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
    }
    
    // Clean up on unmount or when recording state changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRecording, onDurationUpdate]);
  
  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatDuration(duration)}</Text>
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Text style={styles.recordingText}>REC</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  recordingIndicator: {
    marginLeft: 12,
    backgroundColor: colors.recording,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});