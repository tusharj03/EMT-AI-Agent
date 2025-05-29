import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Alert, ScrollView, Platform, TouchableOpacity, TextInput } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useRecordingStore } from '@/store/recordingStore';
import { useSettingsStore } from '@/store/settingsStore';
import RecordingButton from '@/components/RecordingButton';
import RecordingTimer from '@/components/RecordingTimer';
import { processTranscription } from '@/utils/aiUtils';
import { Upload, AlertCircle } from 'lucide-react-native';
import { API_BASE_URL } from '@/constants/api';

export default function RecordScreen() {
  const router = useRouter();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  
  const { 
    isRecording, 
    currentRecording,
    startRecording: startRecordingStore,
    stopRecording: stopRecordingStore,
    updateRecordingDuration,
    setRecordingStatus,
    setTranscription,
    setReport,
  } = useRecordingStore();
  
  const { 
    autoTranscribe,
    autoGenerateReport,
    defaultRecordingTitle,
    providerName,
    organizationName,
  } = useSettingsStore();

  useEffect(() => {
    // Request permissions on component mount
    if (!permissionResponse) {
      requestPermission();
    }
  }, [permissionResponse, requestPermission]);

  const startRecording = async () => {
    try {
      if (!permissionResponse?.granted) {
        const { granted } = await requestPermission();
        if (!granted) {
          Alert.alert(
            "Permission Required", 
            "Please grant microphone permission to record audio."
          );
          return;
        }
      }
      
      // Prepare recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      startRecordingStore(defaultRecordingTitle);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      setRecording(null);
      stopRecordingStore();
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      if (uri && currentRecording) {
        // Save the audio file URI
        const recordingId = currentRecording.id;
        
        if (Platform.OS === 'web') {
          // On web, we can't move files, so just store the URI directly
          // Process the recording if auto-transcribe is enabled
          if (autoTranscribe && currentRecording) {
            processRecording(recordingId, uri);
          } else {
            // Navigate to the recording details
            router.push(`/recording/${recordingId}`);
          }
        } else {
          // On native platforms, we can move the file
          const fileUri = FileSystem.documentDirectory + `recording-${recordingId}.m4a`;
          
          try {
            await FileSystem.moveAsync({
              from: uri,
              to: fileUri,
            });
            
            // Process the recording if auto-transcribe is enabled
            if (autoTranscribe && currentRecording) {
              processRecording(recordingId, fileUri);
            } else {
              // Navigate to the recording details
              router.push(`/recording/${recordingId}`);
            }
          } catch (error) {
            console.error('Failed to save recording', error);
            setRecordingStatus(recordingId, 'error');
            
            // Even if saving fails, we can still try to process with the original URI
            if (autoTranscribe && currentRecording) {
              processRecording(recordingId, uri);
            } else {
              router.push(`/recording/${recordingId}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const [lastError, setLastError] = useState<string|null>(null);

  useEffect(() => {
  console.log('🌐 API_BASE_URL is', API_BASE_URL);
}, []);


  const processRecording = async (recordingId: string, fileUri: string) => {
    setLastError(null);
    const url = `${API_BASE_URL}/transcribe`;
    console.log("🔍 Transcribing:", url, "fileUri=", fileUri);
    try {
      setProcessingStatus('Transcribing audio...');
      
      // In a real app, you would send the audio to a transcription service
      // For this demo, we'll use either the demo transcription input or a mock transcription
           setProcessingStatus('Transcribing with Vosk…');

      // Download the recorded file into a Blob
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const fileResponse = await fetch(fileUri);
        const blob = await fileResponse.blob();
        formData.append('audio', blob, `recording.webm`);
      } else {
        formData.append('audio', {
          uri: fileUri,
          name: `recording-${recordingId}.m4a`,
          type: 'audio/m4a',
        } as any);
      }
      const resp = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      if (!resp.ok) {
        const errBody = await resp.text().catch(()=>"");
        const msg = `POST ${url} → ${resp.status}\n${errBody}`;
        console.error(msg);
        setLastError(msg);
        throw new Error(msg);

      }

      const data = await resp.json();
      const transcriptionText = data.text;

      
      // Update the transcription in the store
      setTranscription(recordingId, transcriptionText);
      setRecordingStatus(recordingId, 'processing');
      
      if (autoGenerateReport) {
        setProcessingStatus('Generating report...');
        
        try {
          // Process the transcription with AI
          const reportData = await processTranscription(transcriptionText);
          
          // Create a report from the AI response
          const report = {
            id: `report-${Date.now()}`,
            recordingId,
            date: new Date().toISOString(),
            patientInfo: reportData.patientInfo,
            vitals: reportData.vitals,
            symptoms: reportData.symptoms,
            treatments: reportData.treatments,
            timeline: reportData.timeline,
            soapNote: reportData.soapNote,
          };
          
          // Update the report in the store
          setReport(recordingId, report);
          
          // Navigate to the report
          router.push(`/report/${recordingId}`);
        } catch (error) {
          console.error('Failed to process recording', error);
          setRecordingStatus(recordingId, 'error');
          Alert.alert('Error', 'Failed to generate report. You can try again from the recording details screen.');
          router.push(`/recording/${recordingId}`);
        }
      } else {
        // Navigate to the recording details
        router.push(`/recording/${recordingId}`);
      }
    } catch (error) {
      console.error('Failed to process recording', error);
      setRecordingStatus(recordingId, 'error');
      Alert.alert('Error', 'Failed to process recording');
    } finally {
      setProcessingStatus(null);
    }
  };

  const handleUploadAudio = async () => {
    // This would be implemented with expo-document-picker or expo-image-picker
    // For now, we'll just show an alert
    Alert.alert(
      "Upload Audio",
      "This feature would allow uploading pre-recorded audio files from your device.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Simulate Upload", 
          onPress: () => {
            // Simulate starting a new recording and immediately processing it
            const recordingId = Date.now().toString();
            startRecordingStore("Uploaded Recording");
            stopRecordingStore();
            
            if (currentRecording) {
              processRecording(recordingId, "simulated-file-uri");
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>EMT-AI Assistant</Text>
        <Text style={styles.subtitle}>
          Record patient encounters and generate clinical reports
        </Text>
      </View>
      
      <View style={styles.recordingContainer}>
        <RecordingTimer 
          isRecording={isRecording} 
          onDurationUpdate={updateRecordingDuration}
        />
        
        <RecordingButton 
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />
        
        {processingStatus && (
          <View style={styles.processingContainer}>
            <Text style={styles.processingText}>{processingStatus}</Text>
          </View>
        )}
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handleUploadAudio}
          >
            <Upload size={20} color={colors.primary} />
            <Text style={styles.uploadText}>Upload Audio</Text>
          </TouchableOpacity>

        </View>
      </View>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to use:</Text>
        <Text style={styles.instructionText}>
          1. Tap the microphone button to start recording your entire patient encounter
        </Text>
        <Text style={styles.instructionText}>
          2. Do not worry about off-topic conversation - our AI will filter it out
        </Text>
        <Text style={styles.instructionText}>
          3. Tap the button again to stop recording when the encounter is complete
        </Text>
        <Text style={styles.instructionText}>
          4. The app will automatically transcribe and analyze the audio
        </Text>
        <Text style={styles.instructionText}>
          5. Review the generated clinical report with accurate timestamps
        </Text>
      </View>
      
      <View style={styles.featureContainer}>
        <Text style={styles.featureTitle}>Key Features:</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Continuous recording during entire patient encounters</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Automatic filtering of non-clinical conversation</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Precise timestamp extraction for vital signs and events</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• SOAP note generation with clinical assessment</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• FHIR-compatible output for EHR integration</Text>
        </View>
      </View>
        {lastError && (
        <Text style={{ color: 'red', textAlign: 'center', margin: 8 }}>
        {lastError}
        </Text>
  )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
  },
  contentContainer: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recordingContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  processingContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.highlight,
    borderRadius: 8,
    width: '100%',
  },
  processingText: {
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    backgroundColor: colors.highlight,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  uploadText: {
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 8,
    backgroundColor: `${colors.secondary}10`,
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  demoText: {
    color: colors.secondary,
    fontWeight: '500',
    marginLeft: 8,
  },
  demoInputContainer: {
    width: '100%',
    marginTop: 16,
    padding: 12,
    backgroundColor: `${colors.secondary}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  demoInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.secondary,
    marginBottom: 8,
  },
  demoInputField: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  demoInputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  demoNoticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  demoNoticeText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 8,
    flex: 1,
  },
  instructionsContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  featureContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  featureItem: {
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});