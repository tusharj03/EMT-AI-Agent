import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';
import { TimelineEvent } from '@/types';
import { formatTimestamp } from '@/utils/audioUtils';

interface TimelineViewProps {
  events: TimelineEvent[];
}

export default function TimelineView({ events }: TimelineViewProps) {
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'vital':
        return '📊';
      case 'symptom':
        return '🔍';
      case 'treatment':
        return '💊';
      case 'observation':
        return '👁️';
      default:
        return '•';
    }
  };
  
  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'vital':
        return colors.primary;
      case 'symptom':
        return colors.warning;
      case 'treatment':
        return colors.success;
      case 'observation':
        return colors.textSecondary;
      default:
        return colors.timelinePoint;
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timeline</Text>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.timeline}>
          {sortedEvents.map((event, index) => (
            <View key={index} style={styles.eventContainer}>
              <View style={styles.timeContainer}>
                <Text style={styles.timestamp}>
                  {formatTimestamp(event.timestamp)}
                </Text>
              </View>
              
              <View style={styles.lineContainer}>
                <View style={styles.line} />
                <View style={[
                  styles.dot,
                  { backgroundColor: getEventColor(event.type) }
                ]}>
                  <Text style={styles.icon}>{getEventIcon(event.type)}</Text>
                </View>
              </View>
              
              <View style={styles.descriptionContainer}>
                <Text style={styles.description}>{event.description}</Text>
                <Text style={[
                  styles.eventType,
                  { color: getEventColor(event.type) }
                ]}>
                  {event.type}
                </Text>
              </View>
            </View>
          ))}
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
    maxHeight: 300,
  },
  timeline: {
    paddingBottom: 16,
  },
  eventContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeContainer: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  timestamp: {
    fontSize: 14,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  lineContainer: {
    width: 30,
    alignItems: 'center',
  },
  line: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: colors.timelineBar,
    left: '50%',
    marginLeft: -1,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.timelinePoint,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  icon: {
    fontSize: 12,
  },
  descriptionContainer: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 16,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  eventType: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
});