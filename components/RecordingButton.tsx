import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Animated, Easing } from 'react-native';
import { colors } from '@/constants/colors';
import { Mic } from 'lucide-react-native';

interface RecordingButtonProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export default function RecordingButton({ 
  isRecording, 
  onStartRecording, 
  onStopRecording 
}: RecordingButtonProps) {
  const [pulseAnim] = useState(new Animated.Value(1));
  
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation;
    
    if (isRecording) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      
      pulseAnimation.start();
    } else {
      pulseAnim.setValue(1);
    }
    
    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isRecording, pulseAnim]);
  
  const handlePress = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };
  
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseCircle,
          {
            transform: [{ scale: pulseAnim }],
            backgroundColor: isRecording ? colors.recording : 'transparent',
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.button,
          isRecording ? styles.recordingButton : styles.notRecordingButton,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Mic 
          size={28} 
          color={isRecording ? '#FFFFFF' : colors.primary} 
          strokeWidth={2}
        />
      </TouchableOpacity>
      <Text style={styles.label}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notRecordingButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  recordingButton: {
    backgroundColor: colors.recording,
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
});