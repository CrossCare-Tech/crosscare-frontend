import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';
import { scheduleAppointmentReminder, areAppointmentRemindersEnabled, cancelAppointmentReminders, debugNotifications } from '../../../utils/NotificationManager';

interface AppointmentForm {
  description: string;
  date: Date;
  time: Date;
}

const AddAppointmentScreen = () => {
  const params = useLocalSearchParams<{
    isEditing?: string;
    appointmentId?: string;
    title?: string;
    date?: string;
  }>();
  
  const isEditing = params.isEditing === 'true';
  const appointmentId = params.appointmentId || '';
  
  const user = useSelector((state: any) => state.user);
  const [form, setForm] = useState<AppointmentForm>({
    description: '',
    date: new Date(),
    time: new Date(),
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load existing appointment data if in edit mode
  useEffect(() => {
    if (isEditing && params.title && params.date) {
      const appointmentDate = new Date(params.date);
      
      setForm({
        description: params.title,
        date: appointmentDate,
        time: appointmentDate,
      });
    }
  }, [isEditing, params.title, params.date]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setForm({ ...form, date: selectedDate });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setForm({ ...form, time: selectedTime });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const handleDelete = async () => {
    if (!isEditing || !appointmentId) return;
    
    Alert.alert(
      "Delete Appointment",
      "Are you sure you want to delete this appointment?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsSubmitting(true);
              
              const patientId = user.user_id;
              
              // Call API to delete appointment
              const response = await fetch(
                `https://crosscare-backends.onrender.com/api/user/activity/${patientId}/appointments/${appointmentId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                }
              );
              
              if (!response.ok) {
                throw new Error('Failed to delete appointment');
              }
              
              // Cancel any scheduled reminders
              await cancelAppointmentReminders(appointmentId);
              
              // Navigate back
              router.back();
            } catch (error) {
              console.error('Error deleting appointment:', JSON.stringify(error, null, 2));
              Alert.alert('Error', 'Failed to delete appointment. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveAppointment = async () => {
    if (!form.description.trim()) {
      Alert.alert('Error', 'Please enter a description for the appointment');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create a combined date and time
      const appointmentDateTime = new Date(form.date);
      appointmentDateTime.setHours(form.time.getHours());
      appointmentDateTime.setMinutes(form.time.getMinutes());
      
      console.log('📅 Appointment DateTime (local):', appointmentDateTime);
      console.log('📅 Appointment DateTime (ISO):', appointmentDateTime.toISOString());
      
      // Get the patient ID from Redux store
      const patientId = user.user_id;
      
      let savedAppointmentId = appointmentId;
      
      if (isEditing) {
        // Update existing appointment
        const response = await fetch(
          `https://crosscare-backends.onrender.com/api/user/activity/${patientId}/appointments/${appointmentId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: form.description,
              appointmentDate: appointmentDateTime.toISOString(),
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update appointment');
        }
        
        // Get the updated appointment data
        const appointmentData = await response.json();
        console.log('Updated appointment response:', appointmentData);
        
        // Cancel existing reminders for this appointment
        await cancelAppointmentReminders(appointmentId);
        
      } else {
        // Create new appointment
        const response = await fetch(
          `https://crosscare-backends.onrender.com/api/user/activity/${patientId}/appointment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: form.description,
              appointmentDate: appointmentDateTime.toISOString(),
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to save appointment');
        }

        // Get the appointment data from the response
        const responseData = await response.json();
        console.log('Full appointment response data:', responseData);
        
        // Extract ID correctly from the response structure
        savedAppointmentId = responseData.id || responseData.data?.id || '';
        console.log('Extracted appointment ID:', savedAppointmentId);
        
        if (!savedAppointmentId) {
          console.error('Warning: No appointment ID found in response');
        }
      }

      // Check if reminders are enabled
      const remindersEnabled = await areAppointmentRemindersEnabled();
      console.log('Reminders Enabled:', remindersEnabled);
      
      // Debug the condition evaluation
      console.log('Checking reminder conditions:', { 
        remindersEnabled, 
        savedAppointmentId, 
        shouldSchedule: Boolean(remindersEnabled && savedAppointmentId) 
      });
      
      // Only schedule reminders if they're enabled and we have an appointment ID
      if (remindersEnabled && savedAppointmentId) {
        console.log('🔔 Scheduling reminders...');
        console.log('Appointment DateTime for reminders:', appointmentDateTime);
        console.log('Current time:', new Date());
        
        // Schedule reminders for this appointment using the utility function
        const reminderIds = await scheduleAppointmentReminder(
          appointmentDateTime, 
          form.description,
          savedAppointmentId
        );
        
        if (reminderIds && reminderIds.length > 0) {
          console.log(`✅ Scheduled ${reminderIds.length} reminders for appointment:`, reminderIds);
          
          // Debug: Check what was actually scheduled
          const debugInfo = await debugNotifications();
          console.log('🔍 Debug info after scheduling:', debugInfo);
        } else {
          console.log('❌ No reminders were scheduled - check logs for errors');
        }
      } else {
        console.log('⏭️ Reminders are disabled or no appointment ID. No reminders scheduled.');
      }

      // Navigate back to calendar screen
      router.back();
    } catch (error) {
      console.error('Error saving appointment:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Failed to save appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Appointment' : 'Add New Appointment'}
        </Text>
        
        {/* Delete button for edit mode */}
        {isEditing && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <FontAwesome5 name="trash" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formContainer}>
        {/* Description Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Appointment Description"
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
          />
        </View>

        {/* Date & Time Section */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date & Time</Text>
          <View style={styles.dateTimeContainer}>
            {/* Date Picker */}
            <TouchableOpacity 
              style={styles.dateInput} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{formatDate(form.date)}</Text>
              <FontAwesome5 name="calendar" size={16} color="#777" />
            </TouchableOpacity>

            {/* Time Picker */}
            <TouchableOpacity 
              style={styles.timeInput} 
              onPress={() => setShowTimePicker(true)}
            >
              <Text>{formatTime(form.time)}</Text>
              <FontAwesome5 name="clock" size={16} color="#777" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={form.date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker Modal */}
        {showTimePicker && (
          <DateTimePicker
            value={form.time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={handleSaveAppointment}
        disabled={isSubmitting}
      >
        <Text style={styles.saveButtonText}>
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Appointment' : 'Save & Continue')}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '48%',
  },
  timeInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '48%',
  },
  saveButton: {
    backgroundColor: '#F9A826',
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AddAppointmentScreen;