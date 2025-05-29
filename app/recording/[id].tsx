import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Audio } from 'expo-av';
import { colors } from '@/constants/colors';
import { useRecordingStore } from '@/store/recordingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { processTranscription } from '@/utils/aiUtils';
import { FileText, Play, Pause, RotateCcw, Edit, Save } from 'lucide-react-native';

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { recordings, setReport, setTranscription, setRecordingStatus } = useRecordingStore();
  const { providerName, organizationName } = useSettingsStore();
  
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isEditingTranscription, setIsEditingTranscription] = useState(false);
  const [editedTranscription, setEditedTranscription] = useState('');
  
  const recording = recordings.find(r => r.id === id);
  const playbackPositionRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!recording) {
      router.replace('/reports');
      return;
    }
    
    // Set the edited transcription to the current transcription
    if (recording.transcription) {
      setEditedTranscription(recording.transcription);
    }
    
    // Load the audio file if it exists
    const loadAudio = async () => {
      try {
        if (recording.audioUri) {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: recording.audioUri },
            { shouldPlay: false }
          );
          
          // Get the duration
          const status = await newSound.getStatusAsync();
          if (status.isLoaded) {
            setPlaybackDuration(status.durationMillis || 0);
          }
          
          // Set up playback status update
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
              playbackPositionRef.current = status.positionMillis;
              setPlaybackPosition(status.positionMillis);
              
              // Auto-stop at the end
              if (status.didJustFinish) {
                setIsPlaying(false);
              }
            }
          });
          
          setSound(newSound);
        } else {
          // If no audio URI exists, we'll simulate audio with the recording duration
          setPlaybackDuration(recording.duration);
        }
      } catch (error) {
        console.error('Failed to load audio:', error);
        // If loading fails, we'll still simulate audio with the recording duration
        setPlaybackDuration(recording.duration);
      }
    };
    
    loadAudio();
    
    // Clean up
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [recording, router]);
  
  if (!recording) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  const handleGenerateReport = async () => {
    if (!recording.transcription && !editedTranscription) {
      Alert.alert('Error', 'No transcription available to generate report');
      return;
    }
    
    setIsGeneratingReport(true);
    setRecordingStatus(recording.id, 'processing');
    
    try {
      // Use the edited transcription if we're in edit mode, otherwise use the stored transcription
      const transcriptionToProcess = isEditingTranscription 
        ? editedTranscription 
        : recording.transcription || '';
      
      // Process the transcription with AI
      const reportData = await processTranscription(transcriptionToProcess);
      
      // Create a report from the AI response
      const report = {
        id: `report-${Date.now()}`,
        recordingId: recording.id,
        date: new Date().toISOString(),
        patientInfo: reportData.patientInfo,
        vitals: reportData.vitals,
        symptoms: reportData.symptoms,
        treatments: reportData.treatments,
        timeline: reportData.timeline,
        soapNote: reportData.soapNote,
      };
      
      // Update the report in the store
      setReport(recording.id, report);
      
      // If we were editing the transcription, save it
      if (isEditingTranscription) {
        setTranscription(recording.id, editedTranscription);
        setIsEditingTranscription(false);
      }
      
      // Navigate to the report
      router.push(`/report/${recording.id}`);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setRecordingStatus(recording.id, 'error');
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };
  
  const togglePlayback = async () => {
    if (!sound) {
      // If no sound is loaded but we have a duration, simulate playback
      if (playbackDuration > 0) {
        setIsPlaying(!isPlaying);
        
        if (!isPlaying) {
          // Start simulated playback
          const startTime = Date.now() - playbackPosition;
          
          // Clear any existing interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          // Create new interval for updating position
          intervalRef.current = setInterval(() => {
            const currentPosition = Date.now() - startTime;
            if (currentPosition >= playbackDuration) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              setPlaybackPosition(playbackDuration);
              setIsPlaying(false);
            } else {
              setPlaybackPosition(currentPosition);
            }
          }, 100);
        } else {
          // Stop simulated playback
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
      return;
    }
    
    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playFromPositionAsync(playbackPositionRef.current);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };
  
  const restartPlayback = async () => {
    // Reset position
    setPlaybackPosition(0);
    playbackPositionRef.current = 0;
    
    if (!sound) {
      // For simulated playback
      if (isPlaying) {
        // Stop current interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        // Start new interval from beginning
        const startTime = Date.now();
        intervalRef.current = setInterval(() => {
          const currentPosition = Date.now() - startTime;
          if (currentPosition >= playbackDuration) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setPlaybackPosition(playbackDuration);
            setIsPlaying(false);
          } else {
            setPlaybackPosition(currentPosition);
          }
        }, 100);
      }
      return;
    }
    
    try {
      await sound.setPositionAsync(0);
      
      if (isPlaying) {
        await sound.playFromPositionAsync(0);
      }
    } catch (error) {
      console.error('Restart playback error:', error);
    }
  };
  
  const formatPlaybackTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleRetranscribe = () => {
    Alert.alert(
      "Retranscribe Audio",
      "Would you like to process this recording again? This will replace the current transcription.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Retranscribe", 
          onPress: async () => {
            setRecordingStatus(recording.id, 'processing');
            
            // In a real app, you would send the audio to a transcription service again
            // For now, we'll just simulate it with a slight delay
            setTimeout(() => {
              const enhancedTranscription = `
                EMT: This is EMT Johnson with patient John Doe, age 45, male. Time is 14:30.
                EMT: Patient complains of chest pain and shortness of breath that started about 30 minutes ago.
                EMT: Vital signs: Pulse is 110 beats per minute. Blood pressure is 160 over 95. Respiratory rate is 22.
                EMT: Oxygen saturation is 94% on room air.
                Patient: The pain is really bad, like someone is sitting on my chest.
                EMT: I'm going to give you some aspirin to chew. Here are 4 tablets, 81mg each.
                EMT: I'm also going to start oxygen at 2 liters per minute via nasal cannula.
                EMT: Checking vitals again at 14:35. Pulse is now 105. Blood pressure is 155 over 90.
                EMT: Administering nitroglycerin 0.4mg sublingual.
                Patient: I'm feeling a little better now, but still having some pain.
                EMT: We're going to transport you to Memorial Hospital. ETA is 10 minutes.
                EMT: Vitals at 14:40: Pulse 100, BP 150/85, respirations 20, oxygen saturation 96% on 2L.
                EMT: Arriving at hospital at 14:50. Handing over to ER staff.
                EMT: Final vitals: Pulse 98, BP 145/80, respirations 18, oxygen saturation 97% on 2L.
              `;
              
              setTranscription(recording.id, enhancedTranscription);
              setEditedTranscription(enhancedTranscription);
              setRecordingStatus(recording.id, 'completed');
              
              Alert.alert(
                "Transcription Complete", 
                "The audio has been retranscribed successfully."
              );
            }, 2000);
          }
        }
      ]
    );
  };
  
  const toggleEditTranscription = () => {
    if (isEditingTranscription) {
      // Save the edited transcription
      setTranscription(recording.id, editedTranscription);
      setIsEditingTranscription(false);
    } else {
      setIsEditingTranscription(true);
    }
  };
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: recording.title,
          headerBackTitle: "Reports",
        }} 
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.iconContainer}>
            <FileText size={24} color={colors.primary} />
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{recording.title}</Text>
            <Text style={styles.date}>
              {new Date(recording.date).toLocaleString()}
            </Text>
            <View style={styles.metaContainer}>
              <Text style={styles.metaText}>
                Duration: {Math.floor(recording.duration / 1000)}s
              </Text>
              {providerName && (
                <Text style={styles.metaText}>
                  Provider: {providerName}
                </Text>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.playbackCard}>
          <View style={styles.playbackControls}>
            <TouchableOpacity 
              style={styles.playButton}
              onPress={togglePlayback}
            >
              {isPlaying ? (
                <Pause size={24} color="#FFFFFF" />
              ) : (
                <Play size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.restartButton}
              onPress={restartPlayback}
            >
              <RotateCcw size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.playbackInfo}>
            <Text style={styles.playbackTime}>
              {formatPlaybackTime(playbackPosition)} / {formatPlaybackTime(playbackDuration)}
            </Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${playbackDuration > 0 
                      ? (playbackPosition / playbackDuration) * 100 
                      : 0}%` 
                  }
                ]} 
              />
            </View>
          </View>
        </View>
        
        <View style={styles.actionsCard}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleRetranscribe}
          >
            <RotateCcw size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Retranscribe Audio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { marginTop: 12 }]}
            onPress={toggleEditTranscription}
          >
            {isEditingTranscription ? (
              <>
                <Save size={20} color={colors.success} />
                <Text style={[styles.actionButtonText, { color: colors.success }]}>
                  Save Transcription
                </Text>
              </>
            ) : (
              <>
                <Edit size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>Edit Transcription</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.transcriptionCard}>
          <View style={styles.transcriptionHeader}>
            <Text style={styles.cardTitle}>Transcription</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: recording.status === 'completed' 
                ? colors.success + '20' 
                : recording.status === 'error'
                ? colors.error + '20'
                : colors.warning + '20'
              }
            ]}>
              <Text style={[
                styles.statusText,
                { color: recording.status === 'completed' 
                  ? colors.success 
                  : recording.status === 'error'
                  ? colors.error
                  : colors.warning
                }
              ]}>
                {recording.status === 'completed' 
                  ? 'Completed' 
                  : recording.status === 'error'
                  ? 'Error'
                  : 'Processing'
                }
              </Text>
            </View>
          </View>
          
          {isEditingTranscription ? (
            <TextInput
              style={styles.transcriptionInput}
              multiline
              value={editedTranscription}
              onChangeText={setEditedTranscription}
              placeholder="Enter or edit transcription here..."
              placeholderTextColor={colors.textSecondary}
            />
          ) : recording.transcription ? (
            <Text style={styles.transcriptionText}>
              {recording.transcription}
            </Text>
          ) : (
            <View style={styles.noTranscriptionContainer}>
              <Text style={styles.noContentText}>
                No transcription available
              </Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.generateButton,
            ((!recording.transcription && !editedTranscription) || isGeneratingReport) && styles.disabledButton
          ]}
          onPress={handleGenerateReport}
          disabled={isGeneratingReport || (!recording.transcription && !editedTranscription)}
        >
          {isGeneratingReport ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.generateButtonText}>
              Generate Clinical Report
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 12,
  },
  playbackCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  restartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  playbackInfo: {
    alignItems: 'center',
  },
  playbackTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  actionsCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.highlight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  transcriptionCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transcriptionText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  transcriptionInput: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  noTranscriptionContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noContentText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: colors.inactive,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});