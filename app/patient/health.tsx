import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FoodIcon from '@/assets/images/Svg/FoodIcon';
import HeartIcon from '@/assets/images/Svg/HeartIcon';
import MedicationIcon from '@/assets/images/Svg/MedicationIcon';
import WeightIcon from '@/assets/images/Svg/WeightIcon';
import WaterIcon from '@/assets/images/Svg/WaterIcon';
import StepsIcon from '@/assets/images/Svg/StepsIcon';
import SleepIcon from '@/assets/images/Svg/SleepIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/theme';
import ScreenBackground from '@/components/ui/ScreenBackground';
import AuthTopBar from '@/components/ui/AuthTopBar';

interface TrackingOption {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

const TrackingOptionsScreen = () => {

  const user = useSelector((state:any) => state.user);
  const userId = user?.user_id;

  const {t} = useTranslation();

  useEffect(() => {
    const setHealthVisited = async () => {
      await AsyncStorage.setItem('health', 'true');
    };

    setHealthVisited();
  }, [userId]);

  // Same trackers as before, grouped so the list reads like the other redesigned screens
  const sections: { title: string; options: TrackingOption[] }[] = [
    {
      title: t('motherCare.vitals'),
      options: [
        {
          id: 'heart-rate',
          title: t('motherCare.heartRate'),
          icon: <HeartIcon width={22} height={22} />,
          onPress: () => router.push('/patient/heart'),
        },
        {
          id: 'blood-pressure',
          title: t('motherCare.bloodPressure'),
          icon: <MaterialCommunityIcons name="heart-pulse" size={22} color={Theme.reminderTypes.heart} />,
          onPress: () => router.push('/patient/bloodpressure'),
        },
        {
          id: 'glucose',
          title: t('motherCare.glucose'),
          icon: <MaterialCommunityIcons name="chart-line" size={22} color={Theme.colors.purple} />,
          onPress: () => router.push('/patient/glucose'),
        },
        {
          id: 'weight',
          title: t('motherCare.weight'),
          icon: <WeightIcon width={22} height={22} />,
          onPress: () => router.push('/patient/weight'),
        },
      ],
    },
    {
      title: t('motherCare.habits'),
      options: [
        {
          id: 'food',
          title: t('motherCare.food'),
          icon: <FoodIcon width={22} height={22} />,
          onPress: () => router.push('/patient/meals'),
        },
        {
          id: 'water',
          title: t('motherCare.water'),
          icon: <WaterIcon width={22} height={22} />,
          onPress: () => router.push('/patient/water'),
        },
        {
          id: 'steps',
          title: t('motherCare.steps'),
          icon: <StepsIcon width={22} height={22} />,
          onPress: () => router.push('/patient/steps'),
        },
        {
          id: 'sleep',
          title: t('motherCare.sleep'),
          icon: <SleepIcon width={22} height={22} />,
          onPress: () => router.push('/patient/sleep'),
        },
      ],
    },
    {
      title: t('motherCare.wellbeing'),
      options: [
        {
          id: 'mood',
          title: t('motherCare.mood'),
          icon: <MaterialCommunityIcons name="emoticon-happy-outline" size={22} color={Theme.colors.magenta} />,
          onPress: () => router.push('/patient/mood'),
        },
        {
          id: 'symptoms',
          title: t('motherCare.symptoms'),
          icon: <MaterialCommunityIcons name="medical-bag" size={22} color={Theme.colors.teal} />,
          onPress: () => router.push('/patient/symptoms'),
        },
        {
          id: 'medication',
          title: t('motherCare.medication'),
          icon: <MedicationIcon width={22} height={22} />,
          onPress: () => router.push('/patient/medication/medications'),
        },
      ],
    },
  ];

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t('cards.motherCare.title')} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionLabel}>{section.title}</Text>
              <View style={styles.card}>
                {section.options.map((option, index) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.row, index > 0 && styles.rowDivider]}
                    onPress={option.onPress}
                    accessibilityRole="button"
                  >
                    <View style={styles.iconChip}>{option.icon}</View>
                    <Text style={styles.rowTitle}>{option.title}</Text>
                    <Feather name="chevron-right" size={18} color={Theme.colors.inkFaint} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 120,
    gap: 18,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkFaint,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairlineLight,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: Theme.typography.subheading,
    color: Theme.colors.ink,
  },
});

export default TrackingOptionsScreen;
