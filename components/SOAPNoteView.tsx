import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';
import { SOAPNote } from '@/types';

interface SOAPNoteViewProps {
  soapNote: SOAPNote;
}

export default function SOAPNoteView({ soapNote }: SOAPNoteViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SOAP Note</Text>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjective</Text>
          <Text style={styles.sectionContent}>{soapNote.subjective}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objective</Text>
          <Text style={styles.sectionContent}>{soapNote.objective}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment</Text>
          <Text style={styles.sectionContent}>{soapNote.assessment}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan</Text>
          <Text style={styles.sectionContent}>{soapNote.plan}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  scrollContainer: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
});