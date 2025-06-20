import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { colors } from '@/constants/colors';
import { useRecordingStore } from '@/store/recordingStore';
import { useSettingsStore } from '@/store/settingsStore';
import PatientInfoCard from '@/components/PatientInfoCard';
import VitalsCard from '@/components/VitalsCard';
import TagsList from '@/components/TagsList';
import TimelineView from '@/components/TimelineView';
import SOAPNoteView from '@/components/SOAPNoteView';
import { FileText, Share2, FileJson } from 'lucide-react-native';
import { generateFHIRReport } from '@/utils/aiUtils';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { recordings } = useRecordingStore();
  const { providerName, organizationName, providerID } = useSettingsStore();
  
  const [isGeneratingFHIR, setIsGeneratingFHIR] = useState(false);
  
  const recording = recordings.find(r => r.id === id);
  const report = recording?.report;
  
  if (!recording || !report) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  const handleShareReport = async () => {
    try {
      // Create a shareable text summary of the report
      const reportText = `
EMT Clinical Report
${new Date(report.date).toLocaleString()}

PATIENT INFORMATION
Name: ${report.patientInfo.name || 'Not specified'}
Age: ${report.patientInfo.age ? `${report.patientInfo.age} years` : 'Not specified'}
Gender: ${report.patientInfo.gender || 'Not specified'}

VITAL SIGNS
${report.vitals.map(v => `${v.type}: ${v.value} ${v.unit || ''}`).join('\n')}

SYMPTOMS
${report.symptoms.join(', ')}

TREATMENTS
${report.treatments.join(', ')}

SOAP NOTE
Subjective: ${report.soapNote.subjective}
Objective: ${report.soapNote.objective}
Assessment: ${report.soapNote.assessment}
Plan: ${report.soapNote.plan}

Generated by EMT-AI Assistant
Provider: ${providerName || 'Not specified'}
Organization: ${organizationName || 'Not specified'}
      `;
      
      await Share.share({
        message: reportText,
        title: `EMT Report - ${recording.title}`,
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };
  
  const handleGenerateFHIR = async () => {
    setIsGeneratingFHIR(true);
    
    try {
      const providerInfo = {
        providerName,
        providerID,
        organizationName,
      };
      
      const fhirData = await generateFHIRReport(report, providerInfo);
      
      Alert.alert(
        "FHIR Report Generated",
        "The FHIR DiagnosticReport has been generated successfully. In a production app, this would be sent to your EHR system.",
        [
          { 
            text: "View JSON", 
            onPress: () => {
              // In a real app, you might show this in a modal or new screen
              Alert.alert("FHIR DiagnosticReport", fhirData.substring(0, 500) + "...");
            } 
          },
          { text: "OK" }
        ]
      );
    } catch (error) {
      console.error('Error generating FHIR report:', error);
      Alert.alert("Error", "Failed to generate FHIR report. Please try again.");
    } finally {
      setIsGeneratingFHIR(false);
    }
  };
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Clinical Report',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleShareReport}
              style={styles.shareButton}
            >
              <Share2 size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
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
              {new Date(report.date).toLocaleString()}
            </Text>
            {providerName && (
              <Text style={styles.provider}>
                Provider: {providerName}
              </Text>
            )}
          </View>
        </View>
        
        <PatientInfoCard patientInfo={report.patientInfo} />
        
        <VitalsCard vitals={report.vitals} />
        
        <TagsList 
          title="Symptoms" 
          tags={report.symptoms} 
          icon="🔍" 
          color={colors.warning}
        />
        
        <TagsList 
          title="Treatments" 
          tags={report.treatments} 
          icon="💊" 
          color={colors.success}
        />
        
        <TimelineView events={report.timeline} />
        
        <SOAPNoteView soapNote={report.soapNote} />
        
        <TouchableOpacity
          style={[
            styles.fhirButton,
            isGeneratingFHIR && styles.disabledButton
          ]}
          onPress={handleGenerateFHIR}
          disabled={isGeneratingFHIR}
        >
          {isGeneratingFHIR ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <FileJson size={20} color="#FFFFFF" />
              <Text style={styles.fhirButtonText}>
                Generate FHIR DiagnosticReport
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Generated by EMT-AI Assistant
          </Text>
          {organizationName && (
            <Text style={styles.footerText}>
              {organizationName}
            </Text>
          )}
          <Text style={styles.footerText}>
            {new Date().toLocaleDateString()}
          </Text>
        </View>
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
  shareButton: {
    padding: 8,
    marginRight: 8,
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
  provider: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  fhirButton: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: colors.inactive,
  },
  fhirButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footerContainer: {
    marginTop: 8,
    marginBottom: 32,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
});