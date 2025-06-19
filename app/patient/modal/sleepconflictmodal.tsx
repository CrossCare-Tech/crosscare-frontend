import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface SleepConflictModalProps {
  isVisible: boolean;
  onClose: () => void;
  conflictingLog: {
    date: string;
    sleepStart: string;
    sleepEnd: string;
    duration: string;
  } | null;
  newLogTime: {
    sleepStart: string;
    sleepEnd: string;
  };
}

const SleepConflictModal: React.FC<SleepConflictModalProps> = ({
  isVisible,
  onClose,
  conflictingLog,
  newLogTime,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.title}>Sleep Time Conflict</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>
              You already have a sleep log that overlaps with this time period.
            </Text>

            <View style={styles.conflictDetails}>
              <Text style={styles.sectionTitle}>Existing Log:</Text>
              <Text style={styles.timeText}>
                {conflictingLog?.sleepStart} - {conflictingLog?.sleepEnd}
              </Text>
              <Text style={styles.durationText}>
                Duration: {conflictingLog?.duration}
              </Text>
            </View>

            <View style={styles.conflictDetails}>
              <Text style={styles.sectionTitle}>New Log (Attempted):</Text>
              <Text style={styles.timeText}>
                {newLogTime.sleepStart} - {newLogTime.sleepEnd}
              </Text>
            </View>

            <Text style={styles.suggestion}>
              Please choose a different time period or delete the existing log first.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#001F3E',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: '#335C85',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter600',
    color: '#E5E5E5',
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter400',
    color: '#E5E5E5',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  conflictDetails: {
    backgroundColor: 'rgba(84, 118, 152, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(84, 118, 152, 0.3)',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter600',
    color: '#FFD764',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 16,
    fontFamily: 'Inter600',
    color: '#E5E5E5',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 12,
    fontFamily: 'Inter400',
    color: '#B0B0B0',
  },
  suggestion: {
    fontSize: 12,
    fontFamily: 'Inter400',
    color: '#B0B0B0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#335C85',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#547698',
  },
  buttonText: {
    color: '#E5E5E5',
    fontSize: 14,
    fontFamily: 'Inter600',
    textAlign: 'center',
  },
});

export default SleepConflictModal; 