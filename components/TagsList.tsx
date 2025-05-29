import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';

interface TagsListProps {
  title: string;
  tags: string[];
  icon?: string;
  color?: string;
}

export default function TagsList({ 
  title, 
  tags, 
  icon = '🏷️', 
  color = colors.primary 
}: TagsListProps) {
  if (!tags || tags.length === 0) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.tagsContainer}
      >
        {tags.map((tag, index) => (
          <View 
            key={index} 
            style={[styles.tag, { backgroundColor: `${color}20` }]}
          >
            <Text style={styles.tagIcon}>{icon}</Text>
            <Text style={[styles.tagText, { color }]}>{tag}</Text>
          </View>
        ))}
      </ScrollView>
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
    marginBottom: 12,
  },
  scrollContainer: {
    flexGrow: 0,
  },
  tagsContainer: {
    paddingRight: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  tagIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
});