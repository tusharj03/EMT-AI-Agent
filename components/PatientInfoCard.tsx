import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { PatientInfo } from '@/types';
import { User } from 'lucide-react-native';

interface PatientInfoCardProps {
  patientInfo: PatientInfo;
}

export default function PatientInfoCard({ patientInfo }: PatientInfoCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <User size={24} color={colors.primary} />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.title}>Patient Information</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>
              {patientInfo.name || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>
              {patientInfo.age ? `${patientInfo.age} years` : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>
              {patientInfo.gender || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>ID</Text>
            <Text style={styles.value}>
              {patientInfo.id || 'Not specified'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
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
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  infoItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
});