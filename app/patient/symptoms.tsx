import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { useSymptomStore, SYMPTOM_TYPES } from '@/zustandStore/useSymptomStore';

type SymptomSeverity = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

const SEVERITY_OPTIONS: { level: SymptomSeverity; label: string; color: string }[] = [
  { level: 'MILD', label: 'Mild', color: '#2ECC71' },
  { level: 'MODERATE', label: 'Moderate', color: '#F1C40F' },
  { level: 'SEVERE', label: 'Severe', color: '#E74C3C' },
];

export default function SymptomsScreen() {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;

  const {
    symptoms,
    summary,
    isLoading,
    fetchSymptoms,
    logSymptom,
    deleteSymptom,
  } = useSymptomStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<SymptomSeverity>('MILD');

  useEffect(() => {
    if (userId) {
      fetchSymptoms(userId);
    }
  }, [userId]);

  const handleOpenModal = (symptomType: string) => {
    setSelectedSymptom(symptomType);
    setSelectedSeverity('MILD');
    setModalVisible(true);
  };

  const handleLogSymptom = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }
    if (!selectedSymptom) return;

    const success = await logSymptom(userId, {
      symptomType: selectedSymptom,
      severity: selectedSeverity,
    });

    if (success) {
      setModalVisible(false);
      Alert.alert('Success', 'Symptom logged successfully!');
    } else {
      Alert.alert('Error', 'Failed to log symptom. Please try again.');
    }
  };

  const handleDeleteSymptom = (symptomId: string) => {
    if (!userId) return;

    Alert.alert('Delete Symptom', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSymptom(userId, symptomId),
      },
    ]);
  };

  const getSymptomLabel = (type: string): string => {
    return SYMPTOM_TYPES.find((s) => s.id === type)?.label || type;
  };

  const getSymptomIcon = (type: string): string => {
    return SYMPTOM_TYPES.find((s) => s.id === type)?.icon || '🔸';
  };

  const getSeverityColor = (severity: string): string => {
    return SEVERITY_OPTIONS.find((s) => s.level === severity)?.color || '#999';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Symptoms</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Add Section */}
        <Text style={styles.sectionTitle}>Log a Symptom</Text>
        <View style={styles.symptomGrid}>
          {SYMPTOM_TYPES.map((symptom) => (
            <TouchableOpacity
              key={symptom.id}
              style={styles.symptomOption}
              onPress={() => handleOpenModal(symptom.id)}
            >
              <Text style={styles.symptomEmoji}>{symptom.icon}</Text>
              <Text style={styles.symptomLabel}>{symptom.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Section */}
        {summary && summary.totalSymptoms > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>
                You've logged <Text style={styles.summaryHighlight}>{summary.totalSymptoms}</Text> symptoms
              </Text>
              {summary.mostCommon && (
                <Text style={styles.summarySubtext}>
                  Most common: {getSymptomLabel(summary.mostCommon)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Recent Symptoms */}
        <Text style={styles.sectionTitle}>Recent Symptoms</Text>
        {symptoms.length > 0 ? (
          <View style={styles.symptomsContainer}>
            {symptoms.slice(0, 10).map((symptom, index) => (
              <View key={symptom.id || index} style={styles.symptomItem}>
                <View style={styles.symptomItemLeft}>
                  <Text style={styles.symptomItemIcon}>{getSymptomIcon(symptom.symptomType)}</Text>
                  <View>
                    <Text style={styles.symptomItemName}>{getSymptomLabel(symptom.symptomType)}</Text>
                    <Text style={styles.symptomItemDate}>{symptom.date}</Text>
                  </View>
                </View>
                <View style={styles.symptomItemRight}>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(symptom.severity) },
                    ]}
                  >
                    <Text style={styles.severityText}>{symptom.severity}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteSymptom(symptom.id)}>
                    <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>No symptoms logged yet.</Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Severity Selection Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedSymptom && getSymptomIcon(selectedSymptom)}{' '}
              {selectedSymptom && getSymptomLabel(selectedSymptom)}
            </Text>

            <Text style={styles.modalSubtitle}>How severe is it?</Text>

            <View style={styles.severityOptions}>
              {SEVERITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.level}
                  style={[
                    styles.severityOption,
                    selectedSeverity === option.level && {
                      borderColor: option.color,
                      borderWidth: 3,
                    },
                  ]}
                  onPress={() => setSelectedSeverity(option.level)}
                >
                  <View style={[styles.severityDot, { backgroundColor: option.color }]} />
                  <Text style={styles.severityOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logButton}
                onPress={handleLogSymptom}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.logButtonText}>Log Symptom</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  symptomOption: {
    width: '23%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 15,
    marginBottom: 10,
  },
  symptomEmoji: {
    fontSize: 24,
  },
  symptomLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
  },
  summaryHighlight: {
    fontWeight: '700',
    color: '#E74C3C',
  },
  summarySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  symptomsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
  },
  symptomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  symptomItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symptomItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  symptomItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  symptomItemDate: {
    fontSize: 12,
    color: '#666',
  },
  symptomItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  severityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  severityOption: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '30%',
  },
  severityDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  severityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  logButton: {
    flex: 1,
    paddingVertical: 15,
    marginLeft: 10,
    borderRadius: 10,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
