import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { Vital } from '@/types';
import { formatTimestamp } from '@/utils/audioUtils';

interface VitalsCardProps {
  vitals: Vital[];
}

export default function VitalsCard({ vitals }: VitalsCardProps) {
  const getVitalIcon = (type: Vital['type']) => {
    switch (type) {
      case 'pulse':
        return '❤️';
      case 'bloodPressure':
        return '🩸';
      case 'respiratoryRate':
        return '🫁';
      case 'temperature':
        return '🌡️';
      case 'oxygenSaturation':
        return '💨';
      default:
        return '📊';
    }
  };
  
  const getVitalTitle = (type: Vital['type']) => {
    switch (type) {
      case 'pulse':
        return 'Pulse';
      case 'bloodPressure':
        return 'Blood Pressure';
      case 'respiratoryRate':
        return 'Respiratory Rate';
      case 'temperature':
        return 'Temperature';
      case 'oxygenSaturation':
        return 'O₂ Saturation';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  // Group vitals by type and get the latest reading for each type
  const latestVitals = vitals.reduce((acc, vital) => {
    if (!acc[vital.type] || vital.timestamp > acc[vital.type].timestamp) {
      acc[vital.type] = vital;
    }
    return acc;
  }, {} as Record<string, Vital>);
  
  const latestVitalsArray = Object.values(latestVitals);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Latest Vital Signs</Text>
      
      <View style={styles.vitalsGrid}>
        {latestVitalsArray.map((vital, index) => (
          <View key={index} style={styles.vitalCard}>
            <Text style={styles.vitalIcon}>{getVitalIcon(vital.type)}</Text>
            <Text style={styles.vitalTitle}>{getVitalTitle(vital.type)}</Text>
            <Text style={styles.vitalValue}>
              {vital.value} {vital.unit || ''}
            </Text>
            <Text style={styles.vitalTimestamp}>
              at {formatTimestamp(vital.timestamp)}
            </Text>
          </View>
        ))}
      </View>
      
      {vitals.length > latestVitalsArray.length && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Vital Signs History</Text>
          
          {vitals.map((vital, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyTime}>
                {formatTimestamp(vital.timestamp)}
              </Text>
              <Text style={styles.historyType}>
                {getVitalTitle(vital.type)}:
              </Text>
              <Text style={styles.historyValue}>
                {vital.value} {vital.unit || ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  vitalCard: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  vitalIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  vitalTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  vitalTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyTime: {
    width: 60,
    fontSize: 12,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  historyType: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  historyValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
});