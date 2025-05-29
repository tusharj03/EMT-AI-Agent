import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Switch, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { useSettingsStore } from '@/store/settingsStore';
import { useRecordingStore } from '@/store/recordingStore';
import { Settings, Save, Trash2 } from 'lucide-react-native';

export default function SettingsScreen() {
  const {
    autoTranscribe,
    autoGenerateReport,
    defaultRecordingTitle,
    organizationName,
    providerName,
    providerID,
    toggleAutoTranscribe,
    toggleAutoGenerateReport,
    setDefaultRecordingTitle,
    setOrganizationName,
    setProviderName,
    setProviderID,
  } = useSettingsStore();
  
  const { recordings, deleteAllRecordings } = useRecordingStore();
  
  const [localTitle, setLocalTitle] = useState(defaultRecordingTitle);
  const [localOrgName, setLocalOrgName] = useState(organizationName);
  const [localProviderName, setLocalProviderName] = useState(providerName);
  const [localProviderID, setLocalProviderID] = useState(providerID);
  
  const handleToggleAutoTranscribe = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    toggleAutoTranscribe();
  };
  
  const handleToggleAutoGenerateReport = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    toggleAutoGenerateReport();
  };
  
  const handleSaveSettings = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setDefaultRecordingTitle(localTitle);
    setOrganizationName(localOrgName);
    setProviderName(localProviderName);
    setProviderID(localProviderID);
    
    Alert.alert('Settings Saved', 'Your settings have been updated successfully.');
  };
  
  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      `Are you sure you want to delete all ${recordings.length} recordings? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: () => {
            deleteAllRecordings();
            Alert.alert('Data Cleared', 'All recordings have been deleted.');
          },
        },
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Settings size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>App Settings</Text>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Auto-Transcribe</Text>
            <Text style={styles.settingDescription}>
              Automatically transcribe recordings when completed
            </Text>
          </View>
          <Switch
            value={autoTranscribe}
            onValueChange={handleToggleAutoTranscribe}
            trackColor={{ false: colors.inactive, true: `${colors.primary}80` }}
            thumbColor={autoTranscribe ? colors.primary : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Auto-Generate Report</Text>
            <Text style={styles.settingDescription}>
              Automatically generate clinical report after transcription
            </Text>
          </View>
          <Switch
            value={autoGenerateReport}
            onValueChange={handleToggleAutoGenerateReport}
            trackColor={{ false: colors.inactive, true: `${colors.primary}80` }}
            thumbColor={autoGenerateReport ? colors.primary : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.inputItem}>
          <Text style={styles.inputLabel}>Default Recording Title</Text>
          <TextInput
            style={styles.textInput}
            value={localTitle}
            onChangeText={setLocalTitle}
            placeholder="Enter default title"
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Settings size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Provider Information</Text>
        </View>
        
        <View style={styles.inputItem}>
          <Text style={styles.inputLabel}>Organization Name</Text>
          <TextInput
            style={styles.textInput}
            value={localOrgName}
            onChangeText={setLocalOrgName}
            placeholder="Enter organization name"
          />
        </View>
        
        <View style={styles.inputItem}>
          <Text style={styles.inputLabel}>Provider Name</Text>
          <TextInput
            style={styles.textInput}
            value={localProviderName}
            onChangeText={setLocalProviderName}
            placeholder="Enter your name"
          />
        </View>
        
        <View style={styles.inputItem}>
          <Text style={styles.inputLabel}>Provider ID</Text>
          <TextInput
            style={styles.textInput}
            value={localProviderID}
            onChangeText={setLocalProviderID}
            placeholder="Enter your provider ID"
          />
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveSettings}
        >
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearAllData}
        >
          <Trash2 size={20} color={colors.error} />
          <Text style={styles.clearButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>EMT-AI Assistant v1.0.0</Text>
        <Text style={styles.footerText}>© 2025 Medical AI Solutions</Text>
      </View>
    </ScrollView>
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
  section: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  inputItem: {
    marginVertical: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonContainer: {
    marginVertical: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  clearButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  clearButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});