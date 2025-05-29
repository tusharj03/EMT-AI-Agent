import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { Recording } from '@/types';
import { formatDuration } from '@/utils/audioUtils';
import { FileText, Trash2 } from 'lucide-react-native';

interface RecordingCardProps {
  recording: Recording;
  onPress: (recording: Recording) => void;
  onDelete: (id: string) => void;
}

export default function RecordingCard({ 
  recording, 
  onPress, 
  onDelete 
}: RecordingCardProps) {
  const { id, title, date, duration, status } = recording;
  
  const formattedDate = new Date(date).toLocaleString();
  
  const getStatusColor = () => {
    switch (status) {
      case 'recording':
        return colors.recording;
      case 'processing':
        return colors.warning;
      case 'completed':
        return colors.success;
      case 'error':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'recording':
        return 'Recording';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(recording)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <FileText size={24} color={colors.primary} />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.date}>{formattedDate}</Text>
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: getStatusColor() }
            ]} 
          />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(id)}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Trash2 size={20} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  detailsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 12,
  },
  duration: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
});