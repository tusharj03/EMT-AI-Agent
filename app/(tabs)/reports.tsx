import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useRecordingStore } from '@/store/recordingStore';
import RecordingCard from '@/components/RecordingCard';
import { Recording } from '@/types';
import { FileUp } from 'lucide-react-native';

export default function ReportsScreen() {
  const router = useRouter();
  const { recordings, deleteRecording } = useRecordingStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRecordingPress = (recording: Recording) => {
    if (recording.report) {
      router.push(`/report/${recording.id}`);
    } else {
      router.push(`/recording/${recording.id}`);
    }
  };
  
  const handleDeleteRecording = (id: string) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteRecording(id),
        },
      ]
    );
  };
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    // In a real app, you might fetch updated data here
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FileUp size={64} color={colors.inactive} />
      <Text style={styles.emptyTitle}>No Recordings Yet</Text>
      <Text style={styles.emptyText}>
        Your recorded patient encounters will appear here.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/')}
      >
        <Text style={styles.emptyButtonText}>Start Recording</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordingCard
            recording={item}
            onPress={handleRecordingPress}
            onDelete={handleDeleteRecording}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          recordings.length === 0 && styles.emptyListContent
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});