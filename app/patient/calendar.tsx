import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSelector } from 'react-redux'; // Add this import
import AsyncStorage from '@react-native-async-storage/async-storage';
import { areAppointmentRemindersEnabled, setAppointmentRemindersEnabled } from '../../utils/NotificationManager';

// Define appointment type
interface Appointment {
  id: string;
  title: string;
  date: string;
  status?: 'Completed' | 'Upcoming'; // Add status field
}

const Calendar = () => {
  const user = useSelector((state: any) => state.user); // Get user data from Redux store
  const [activeTab, setActiveTab] = useState('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState(true); // Default to enabled

  // Load reminder preference on mount
  useEffect(() => {
    const loadReminderPreference = async () => {
      try {
        const enabled = await areAppointmentRemindersEnabled();
        setRemindersEnabled(enabled);
      } catch (error) {
        console.error('Error loading reminder preference:', error);
      }
    };
    
    loadReminderPreference();
  }, []);

  // Toggle reminder setting
  const toggleReminders = async () => {
    try {
      const newValue = !remindersEnabled;
      setRemindersEnabled(newValue);
      await setAppointmentRemindersEnabled(newValue);
    } catch (error) {
      console.error('Error saving reminder preference:', error);
    }
  };

  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the patient ID from your Redux store
      const patientId = user.user_id;
      console.log(patientId);

      const response = await fetch(`https://crosscare-backends.onrender.com/api/user/activity/${patientId}/appointments`, {
        headers: {
          // Add authorization header if needed
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      console.log(data);
      
      // Process the appointments to add status
      const now = new Date();
      const processedAppointments = data.map((appointment: Appointment) => {
        const appointmentDate = new Date(appointment.date);
        const status = appointmentDate < now ? 'Completed' : 'Upcoming';
        return { ...appointment, status };
      });
      
      setAppointments(processedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', JSON.stringify(error, null, 2));
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments based on active tab
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredAppointments(appointments);
    } else if (activeTab === 'upcoming') {
      const upcoming = appointments.filter(appointment => appointment.status === 'Upcoming');
      setFilteredAppointments(upcoming);
    }
  }, [activeTab, appointments]);

  // Load appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('Calendar screen in focus, refreshing appointments...');
      fetchAppointments();
      
      return () => {
        // Optional cleanup if needed
      };
    }, [])
  );

  const handleAddAppointment = () => {
    router.push('/patient/modal/add-appointment');
  };

  // Handle appointment click - only for upcoming appointments
  const handleAppointmentClick = (appointment: Appointment) => {
    if (appointment.status === 'Upcoming') {
      // Navigate to edit appointment screen with appointment data
      router.push({
        pathname: '/patient/modal/add-appointment',
        params: {
          isEditing: 'true',
          appointmentId: appointment.id,
          title: appointment.title,
          date: appointment.date
        }
      });
    }
  };

  // Format date for display
  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time for display
  const formatAppointmentTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Appointments</Text>
      </View>

      {/* Clock Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.clockCircle}>
          <FontAwesome5 name="clock" size={87} color="#F9A826" />
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddAppointment}
      >
        <Text style={styles.addButtonText}>+ Add New Appointment</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]} 
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} 
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
        </Pressable>
      </View>

      {/* Appointments List */}
      <ScrollView style={styles.appointmentsList}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F9A826" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchAppointments} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <TouchableOpacity
              key={appointment.id}
              style={[
                styles.appointmentItem,
                appointment.status === 'Upcoming' && styles.clickableAppointment
              ]}
              onPress={() => handleAppointmentClick(appointment)}
              disabled={appointment.status !== 'Upcoming'}
            >
              <View style={styles.appointmentContent}>
                <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                <View style={styles.appointmentDetails}>
                  <View style={styles.appointmentDetail}>
                    <FontAwesome5 name="calendar" size={14} color="#777" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{formatAppointmentDate(appointment.date)}</Text>
                  </View>
                  <View style={styles.appointmentDetail}>
                    <FontAwesome5 name="clock" size={14} color="#777" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{formatAppointmentTime(appointment.date)}</Text>
                  </View>
                </View>
              </View>
              
              {/* Status Badge */}
              {appointment.status && (
                <View style={[
                  styles.statusBadge, 
                  appointment.status === 'Completed' ? styles.completedBadge : styles.upcomingBadge
                ]}>
                  <Text style={[
                    styles.statusText,
                    appointment.status === 'Completed' ? styles.completedText : styles.upcomingText
                  ]}>
                    {appointment.status}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No Appointments Tracked Yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Reminder Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Reminder {remindersEnabled ? 'On' : 'Off'} By Default, {' '}
          <Text 
            style={styles.footerLink} 
            onPress={toggleReminders}
          >
            {remindersEnabled ? 'Turn Off Reminder' : 'Turn On Reminder'}
          </Text>
        </Text>
      </View>
    </View>
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
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  clockCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#F9A826',
    marginLeft: 20,
    marginRight: 'auto',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#F9A826',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F9A826',
  },
  tabText: {
    fontSize: 16,
    color: '#888888',
  },
  activeTabText: {
    fontWeight: '600',
    color: '#000000',
  },
  appointmentsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  appointmentItem: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#F9FAFC',
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F9A826',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  appointmentDetails: {
    marginTop: 4,
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  completedBadge: {
    backgroundColor: '#FFF4E5',
  },
  upcomingBadge: {
    backgroundColor: '#F0F8FF',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedText: {
    color: '#F9A826',
  },
  upcomingText: {
    color: '#4A90E2',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#F9A826',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#777777',
  },
  footerLink: {
    color: '#F9A826',
  },
  clickableAppointment: {
    borderLeftColor: '#4A90E2',
  },
  editIconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Calendar;