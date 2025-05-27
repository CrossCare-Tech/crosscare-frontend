// app/patient/modal/caloriegoalmodal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface CalorieGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goal: string) => void;
}

const CalorieGoalModal = ({ visible, onClose, onSave }: CalorieGoalModalProps) => {
  const [calorieGoal, setCalorieGoal] = useState('');
  const { t } = useTranslation();
  
  const handleSave = () => {
    if (calorieGoal.trim() === '') return;
    onSave(calorieGoal);
    setCalorieGoal(''); // Reset the input
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('meals.setCalorieGoal')}</Text>
          
          <TextInput
            style={styles.input}
            placeholder={t('meals.enterCalorieGoal')}
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={calorieGoal}
            onChangeText={setCalorieGoal}
            autoFocus
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, !calorieGoal.trim() && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={!calorieGoal.trim()}
            >
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter600',
    color: '#38C472',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter400',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Inter500',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#38C472',
  },
  saveButtonDisabled: {
    backgroundColor: '#A3E4BE',
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Inter500',
  }
});

export default CalorieGoalModal;