import { dateKeyOf, toLocalDateString, todayDateString } from "@/utils/date";
import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native"
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import HeartCard from "@/components/HeartCard"
import { useSelector } from "react-redux"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as WebBrowser from "expo-web-browser"
import { useFitbit } from "@/zustandStore/useFitbitStore"
import { useAppleHealth } from "@/zustandStore/useAppleHealthStore"
import { useTranslation } from "react-i18next"

const { width } = Dimensions.get("window")
const BAR_WIDTH = 20
const SPACING = (width - BAR_WIDTH * 10) / 8
const MAX_HEIGHT = 200

WebBrowser.maybeCompleteAuthSession();

interface DataItem {
  day: string
  bpm: number
  date: string
  isRangeLabel?: boolean
  rangeLabel?: string
  id?: string
  source?: 'fitbit' | 'apple'
}

interface CustomBarProps {
  item: DataItem
  index: number
  isSelected: boolean
  roundedMax: number
  roundedMin: number
  timeRange: string
}

type TimeRangeOption = {
  id: string
  label: string
}

const safeParseDate = (dateString: string | number | Date): Date | null => {
  try {
    if (!dateString) return null;
    
    if (dateString instanceof Date) {
      return isNaN(dateString.getTime()) ? null : dateString;
    }
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}`);
      return null;
    }
    
    return date;
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    return null;
  }
};

export default function HeartRateScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("week")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [tooltipAnim] = useState(new Animated.Value(0))
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const user = useSelector((state: any) => state.user)
  const [heartRateData, setHeartRateData] = useState<DataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filteredData, setFilteredData] = useState<DataItem[]>([])
  const [currentHeartRate, setCurrentHeartRate] = useState<number>(0)

  const userId = user?.user_id;
  
  const {t} = useTranslation();

  const timeRangeOptions: TimeRangeOption[] = [
    { id: "today", label: t('hearts.Today') },
    { id: "week", label: t('hearts.Last7Days') },
    { id: "month", label: t('hearts.ThisMonth') },
    { id: "lastMonth", label: t('hearts.LastMonth') },
  ]

  useEffect(() => {
    const setHeartVisited = async () => {
      if(user?.user_id){
        await AsyncStorage.setItem('heart_2', 'true');
      }
    };
    setHeartVisited();
  }, [userId]);

  const periodSelectorRef = useRef<View>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })

  // Use both Fitbit and Apple Health hooks
  const { 
    isConnected: fitbitConnected, 
    isLoading: fitbitLoading, 
    connect: connectFitbit, 
    disconnect: disconnectFitbit, 
    getHeartRateDataForRange: getFitbitHeartRateData,
    getHeartRateData: getFitbitHeartRateDataRaw
  } = useFitbit();

  const { 
    isConnected: appleConnected, 
    isLoading: appleLoading, 
    connect: connectApple, 
    disconnect: disconnectApple,
    checkConnection: checkAppleConnection,
    getHeartRateDataForRange: getAppleHeartRateData,
    getCurrentHeartRate: getAppleCurrentHeartRate
  } = useAppleHealth();

  // Check if any service is connected
  const isAnyConnected = fitbitConnected || appleConnected;
  const isAnyLoading = fitbitLoading || appleLoading;

  // Initialize Apple Health connection check on mount
  useEffect(() => {
    if (Platform.OS === 'ios') {
      checkAppleConnection();
    }
  }, []);

  // Fetch heart rate data from available sources
  const fetchHeartRateData = async () => {
    try {
      console.log(`Fetching heart rate data for time range: ${timeRange}`);
      console.log(`Fitbit connected: ${fitbitConnected}, Apple connected: ${appleConnected}`);
      
      let allData: DataItem[] = [];

      // Fetch from Fitbit if connected
      if (fitbitConnected) {
        try {
          const fitbitData = await getFitbitHeartRateData(timeRange);
          if (fitbitData) {
            const processedFitbitData = processFitbitHeartRateData(fitbitData);
            allData = [...allData, ...processedFitbitData];
          }
        } catch (error) {
          console.error('Error fetching Fitbit data:', error);
        }
      }

      // Fetch from Apple Health if connected and on iOS
      if (appleConnected && Platform.OS === 'ios') {
        try {
          const appleData = await getAppleHeartRateData(timeRange);
          if (appleData) {
            const processedAppleData = processAppleHeartRateData(appleData);
            allData = [...allData, ...processedAppleData];
          }
        } catch (error) {
          console.error('Error fetching Apple Health data:', error);
        }
      }

      // Merge data from multiple sources (prefer more recent readings)
      const mergedData = mergeHeartRateData(allData);
      
      return mergedData;
    } catch (error) {
      console.error('Error fetching heart rate data:', error);
      return [];
    }
  };

  // Get current heart rate from available sources
  const getCurrentHeartRateFromSources = async () => {
    try {
      let currentRate = 0;

      // Try Apple Health first if connected (usually more frequent readings)
      if (appleConnected && Platform.OS === 'ios') {
        try {
          const appleRate = await getAppleCurrentHeartRate();
          if (appleRate > 0) {
            currentRate = appleRate;
          }
        } catch (error) {
          console.error('Error getting Apple Health current heart rate:', error);
        }
      }

      // Try Fitbit if no Apple data or not connected
      if (currentRate === 0 && fitbitConnected) {
        try {
          const today = todayDateString();
          const data = await getFitbitHeartRateDataRaw(today, '1d');
          
          if (data && data['activities-heart'] && data['activities-heart'].length > 0) {
            const todayData = data['activities-heart'][0];
            
            if (todayData.value?.restingHeartRate) {
              currentRate = todayData.value.restingHeartRate;
            } else if (todayData.value?.heartRateZones) {
              let totalMinutes = 0;
              let weightedSum = 0;
              
              todayData.value.heartRateZones.forEach((zone: any) => {
                if (zone.minutes && zone.minutes > 0 && zone.min && zone.max) {
                  const avgZoneRate = (zone.min + zone.max) / 2;
                  weightedSum += avgZoneRate * zone.minutes;
                  totalMinutes += zone.minutes;
                }
              });
              
              if (totalMinutes > 0) {
                currentRate = Math.round(weightedSum / totalMinutes);
              }
            }
          }
        } catch (error) {
          console.error('Error getting Fitbit current heart rate:', error);
        }
      }

      return currentRate;
    } catch (error) {
      console.error('Error getting current heart rate:', error);
      return 0;
    }
  };

  // Process Fitbit heart rate data
  const processFitbitHeartRateData = (fitbitData: any): DataItem[] => {
    if (!fitbitData || !fitbitData['activities-heart']) {
      return [];
    }
    
    const heartRateData = fitbitData['activities-heart'];
    const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"];
    
    return heartRateData
      .map((item: any) => {
        try {
          if (!item || !item.dateTime) {
            return null;
          }
          
          const date = safeParseDate(item.dateTime);
          if (!date) {
            return null;
          }
          
          const dayIndex = date.getDay();
          const dayAbbr = fixedWeekdays[dayIndex];
          
          let bpm = 0;
          
          if (item.value?.restingHeartRate) {
            bpm = item.value.restingHeartRate;
          } else if (item.value?.heartRateZones && item.value.heartRateZones.length > 0) {
            let totalMinutes = 0;
            let weightedSum = 0;
            
            item.value.heartRateZones.forEach((zone: any) => {
              if (zone.minutes && zone.minutes > 0 && zone.min && zone.max) {
                const avgZoneRate = (zone.min + zone.max) / 2;
                weightedSum += avgZoneRate * zone.minutes;
                totalMinutes += zone.minutes;
              }
            });
            
            if (totalMinutes > 0) {
              bpm = Math.round(weightedSum / totalMinutes);
            }
          }
          
          if (bpm === 0) {
            return null;
          }
          
          return {
            day: dayAbbr,
            bpm: bpm,
            date: item.dateTime,
            source: 'fitbit' as const,
          };
        } catch (error) {
          console.error(`Error processing Fitbit data item`, error);
          return null;
        }
      })
      .filter(Boolean);
  };

  // Process Apple Health heart rate data
  const processAppleHeartRateData = (appleData: any): DataItem[] => {
    if (!appleData || !appleData['activities-heart']) {
      return [];
    }
    
    const heartRateData = appleData['activities-heart'];
    const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"];
    
    return heartRateData
      .map((item: any) => {
        try {
          if (!item || !item.dateTime) {
            return null;
          }
          
          const date = safeParseDate(item.dateTime);
          if (!date) {
            return null;
          }
          
          const dayIndex = date.getDay();
          const dayAbbr = fixedWeekdays[dayIndex];
          
          let bpm = 0;
          
          if (item.value?.restingHeartRate) {
            bpm = item.value.restingHeartRate;
          }
          
          if (bpm === 0) {
            return null;
          }
          
          return {
            day: dayAbbr,
            bpm: bpm,
            date: item.dateTime,
            source: 'apple' as const,
          };
        } catch (error) {
          console.error(`Error processing Apple Health data item`, error);
          return null;
        }
      })
      .filter(Boolean);
  };

  // Merge heart rate data from multiple sources
  const mergeHeartRateData = (allData: DataItem[]): DataItem[] => {
    const dataByDate = new Map<string, DataItem[]>();
    
    allData.forEach(item => {
      if (!dataByDate.has(item.date)) {
        dataByDate.set(item.date, []);
      }
      dataByDate.get(item.date)!.push(item);
    });
    
    const mergedData: DataItem[] = [];
    
    for (const [date, items] of dataByDate.entries()) {
      if (items.length === 1) {
        mergedData.push(items[0]);
      } else {
        // Multiple sources for same date - prefer Apple Health for more frequent readings
        const appleItem = items.find(item => item.source === 'apple');
        const fitbitItem = items.find(item => item.source === 'fitbit');
        
        if (appleItem && fitbitItem) {
          // Use average of both sources
          const avgBpm = Math.round((appleItem.bpm + fitbitItem.bpm) / 2);
          mergedData.push({
            ...appleItem,
            bpm: avgBpm,
            source: 'apple'
          });
        } else {
          mergedData.push(appleItem || fitbitItem!);
        }
      }
    }
    
    return mergedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Handle device connections
  const handleAppleHealthConnection = async () => {
    if (appleConnected) {
      await disconnectApple();
      Alert.alert('Disconnected', 'Successfully disconnected from Apple Health');
      if (!fitbitConnected) {
        setHeartRateData([]);
        setFilteredData([]);
        setCurrentHeartRate(0);
      }
    } else {
      const success = await connectApple();
      if (success) {
        Alert.alert('Success', 'Connected to Apple Health');
        getHeartRateStatus();
      } else {
        Alert.alert('Error', 'Failed to connect to Apple Health');
      }
    }
  };

  const handleFitbitConnection = async () => {
    if (fitbitConnected) {
      await disconnectFitbit();
      Alert.alert('Disconnected', 'Successfully disconnected from Fitbit');
      if (!appleConnected) {
        setHeartRateData([]);
        setFilteredData([]);
        setCurrentHeartRate(0);
      }
    } else {
      const success = await connectFitbit();
      if (success) {
        Alert.alert('Success', 'Connected to Fitbit');
        getHeartRateStatus();
      } else {
        Alert.alert('Error', 'Failed to connect to Fitbit');
      }
    }
  };

  const generateAllDays = (timeRange: string): DataItem[] => {
    const today = new Date()
    const days = []
    let startDate: Date
    let endDate: Date

    if (timeRange === "today") {
      const todayStr = toLocalDateString(today)

      return [
        {
          id: `today-${todayStr}`,
          date: todayStr,
          day: t('hearts.Today') ,
          bpm: 0,
        },
      ]
    } else if (timeRange === "week") {
      startDate = new Date(today)
      const dayOfWeek = startDate.getDay()
      startDate.setDate(startDate.getDate() - dayOfWeek)

      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)

      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateString = toLocalDateString(currentDate)
        days.push({
          id: `empty-${dateString}`,
          date: dateString,
          day: currentDate.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
          bpm: 0,
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else if (timeRange === "month" || timeRange === "lastMonth") {
      const dateRanges = [
        { label: "1", start: 1, end: 4 },
        { label: "5", start: 5, end: 9 },
        { label: "10", start: 10, end: 14 },
        { label: "15", start: 15, end: 19 },
        { label: "20", start: 20, end: 24 },
        { label: "25", start: 25, end: 29 },
        { label: "30", start: 30, end: 31 },
      ]

      if (timeRange === "month") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      } else {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        endDate = new Date(today.getFullYear(), today.getMonth(), 0)
      }

      const lastDay = endDate.getDate()

      for (const range of dateRanges) {
        if (range.start <= lastDay) {
          const labelDate = new Date(startDate)
          labelDate.setDate(range.start)
          const labelDateString = toLocalDateString(labelDate)

          days.push({
            id: `label-${labelDateString}`,
            date: labelDateString,
            day: range.label,
            bpm: 0,
            isRangeLabel: true,
          })

          for (let day = range.start; day <= Math.min(range.end, lastDay); day++) {
            const currentDate = new Date(startDate)
            currentDate.setDate(day)
            const dateString = toLocalDateString(currentDate)

            days.push({
              id: `day-${dateString}`,
              date: dateString,
              day: "",
              bpm: 0,
              rangeLabel: range.label,
            })
          }
        }
      }
    }

    return days
  }

  const processDataForTimeRange = (data: DataItem[], timeRange: string) => {
    const allDays = generateAllDays(timeRange);
  
    if (data.length === 0) {
      return allDays;
    }
  
    const dataMap = new Map();
    data.forEach((item) => {
      if (item.date) {
        try {
          const date = safeParseDate(item.date);
          if (date) {
            const dateKey = toLocalDateString(date);
            dataMap.set(dateKey, item);
          }
        } catch (error) {
          console.error(`Error processing date: ${item.date}`, error);
        }
      }
    });
  
    if (timeRange === "today") {
      try {
        const todayStr = todayDateString();
        const todayData = dataMap.get(todayStr);
  
        if (todayData) {
          return [
            {
              id: `today-${todayStr}`,
              date: todayStr,
              day: t('hearts.Today') ,
              bpm: todayData.bpm || 0,
            },
          ];
        } else {
          return allDays;
        }
      } catch (error) {
        console.error("Error processing today's data", error);
        return allDays;
      }
    }
  
    return allDays.map((day) => {
      try {
        const existingData = dataMap.get(day.date);
        if (existingData) {
          return {
            ...day,
            bpm: existingData.bpm || 0,
            isRangeLabel: day.isRangeLabel,
            rangeLabel: day.rangeLabel,
            source: existingData.source,
          };
        }
        return day;
      } catch (error) {
        console.error(`Error mapping day: ${day.date}`, error);
        return day;
      }
    });
  };

  const getHeartRateStatus = async () => {
    setIsLoading(true)
    try {
      if (isAnyConnected) {
        console.log(`Getting heart rate status for time range: ${timeRange}`);
        
        const heartRateData = await fetchHeartRateData();
        
        if (heartRateData && heartRateData.length > 0) {
          console.log("Processed heart rate data:", heartRateData);
          
          const latestHeartRate = await getCurrentHeartRateFromSources();
          setCurrentHeartRate(latestHeartRate);
          
          console.log("Latest heart rate:", latestHeartRate);
          
          setHeartRateData(heartRateData);
          
          const filteredData = processDataForTimeRange(heartRateData, timeRange);
          setFilteredData(filteredData);
          console.log("Filtered data for display:", filteredData);
        } else {
          console.log("No heart rate data available");
          setHeartRateData([]);
          setFilteredData([]);
          setCurrentHeartRate(0);
        }
      } else {
        console.log("No devices connected");
        setHeartRateData([]);
        setFilteredData([]);
        setCurrentHeartRate(0);
      }
    } catch (error) {
      console.error("Error fetching heart rate status:", error)
      setHeartRateData([]);
      setFilteredData([]);
      setCurrentHeartRate(0);
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const filtered = processDataForTimeRange(heartRateData, timeRange)
    setFilteredData(filtered)
    setSelectedIndex(null)
  }, [timeRange, heartRateData])

  useEffect(() => {
    getHeartRateStatus()
  }, [fitbitConnected, appleConnected, timeRange])

  useEffect(() => {
    if (isAnyConnected) {
      const interval = setInterval(async () => {
        try {
          const latestHeartRate = await getCurrentHeartRateFromSources();
          setCurrentHeartRate(latestHeartRate);
          
          const today = new Date();
          const todayStr = toLocalDateString(today);
          
          setHeartRateData((prevData) => {
            const updatedData = [...prevData];
            const todayIndex = updatedData.findIndex(
              (item) => dateKeyOf(item.date) === todayStr,
            );
            
            if (todayIndex >= 0) {
              updatedData[todayIndex] = {
                ...updatedData[todayIndex],
                bpm: latestHeartRate,
              };
            }
            
            return updatedData;
          });
        } catch (error) {
          console.error("Error updating heart rate:", error);
        }
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [isAnyConnected])

  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    if (!filteredData.length || !isAnyConnected) {
      return { yAxisLabels: [100, 90, 80, 70, 60], roundedMax: 100, roundedMin: 60 }
    }

    const nonZeroBpms = filteredData.filter((item) => !item.isRangeLabel && item.bpm > 0).map((item) => item.bpm)

    if (nonZeroBpms.length === 0) {
      return { yAxisLabels: [100, 90, 80, 70, 60], roundedMax: 100, roundedMin: 60 }
    }

    const maxBpm = Math.max(...nonZeroBpms)
    const minBpm = Math.min(...nonZeroBpms)

    const paddedMax = maxBpm + 5
    const paddedMin = Math.max(60, minBpm - 5)

    const roundedMax = Math.ceil(paddedMax / 5) * 5
    const roundedMin = Math.floor(paddedMin / 5) * 5

    const range = roundedMax - roundedMin
    const step = Math.ceil(range / 4) || 5

    const labels = []
    for (let i = 0; i <= 4; i++) {
      const value = roundedMin + step * i
      if (value <= roundedMax) {
        labels.push(value)
      }
    }

    if (labels[labels.length - 1] < roundedMax) {
      labels.push(roundedMax)
    }

    return {
      yAxisLabels: labels.reverse(),
      roundedMax,
      roundedMin,
    }
  }, [filteredData, isAnyConnected])

  const hideTooltipAfterDelay = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }

    tooltipTimeoutRef.current = setTimeout(() => {
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSelectedIndex(null)
      })
    }, 3000)
  }

  const handleBarPress = (index: number): void => {
    const item = filteredData[index]

    if (item.isRangeLabel || item.bpm <= 0) {
      return
    }

    if (selectedIndex === index) {
      setSelectedIndex(null)
      return
    }

    Animated.sequence([
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tooltipAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    setSelectedIndex(index)
    hideTooltipAfterDelay()
  }

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [])

  const getTimeRangeLabel = () => {
    const option = timeRangeOptions.find((option) => option.id === timeRange)
    return option ? option.label : "Last 7 Days"
  }

  const CustomBar = ({ item, index, isSelected, timeRange }: CustomBarProps) => {
    const isMonthView = timeRange !== "week" && timeRange !== "today"

    if (isMonthView && item.isRangeLabel) {
      return (
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeLabel}>{item.day}</Text>
        </View>
      )
    }

    const hasBpm = item.bpm > 0

    const dataRange = roundedMax - roundedMin
    const normalizedBpm = hasBpm ? item.bpm - roundedMin : 0

    let barHeight = 0
    if (dataRange > 0 && normalizedBpm > 0) {
      barHeight = (normalizedBpm / dataRange) * MAX_HEIGHT
      barHeight = Math.max(barHeight, 2)
    }

    let barWidth = BAR_WIDTH
    if (isMonthView) {
      barWidth = 4
    } else if (timeRange === "today") {
      barWidth = BAR_WIDTH * 2
    }

    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      
      try {
        const date = safeParseDate(dateString);
        
        if (!date) {
          return dateString;
        }
        
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).toUpperCase();
      } catch (e) {
        console.error(`Error formatting date: ${dateString}`, e);
        return dateString;
      }
    };

    // Get source indicator color
    const getSourceColor = (source?: string) => {
      if (source === 'apple') return "#007AFF"; // Apple blue
      if (source === 'fitbit') return "#00B0B9"; // Fitbit teal
      return "#D53E4F"; // Default red
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => (hasBpm ? handleBarPress(index) : null)}
        style={[
          styles.barContainer,
          timeRange === "today" && {
            width: barWidth,
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-end",
          },
          isMonthView && {
            width: barWidth,
            marginRight: 2,
            marginLeft: item.rangeLabel && index > 0 && filteredData[index - 1].rangeLabel !== item.rangeLabel ? 10 : 0,
          },
        ]}
        disabled={!hasBpm}
      >
        {(timeRange === "week" || timeRange === "today") && (
          <View style={styles.barLabelContainer}>
            <Text style={styles.barLabel}>{item.day}</Text>
          </View>
        )}

        {hasBpm && (
          <View style={[styles.barWrapper, { height: barHeight }, { width: barWidth }]}>
            <LinearGradient
              colors={isSelected ? [getSourceColor(item.source), getSourceColor(item.source)] : ["#F2C3C8", "#F2C3C8"]}
              style={[
                styles.bar,
                { height: "100%" },
                isMonthView && { borderTopLeftRadius: 2, borderTopRightRadius: 2 },
              ]}
            />
            {/* Source indicator dot */}
            {item.source && (
              <View style={[
                styles.sourceIndicator, 
                { backgroundColor: getSourceColor(item.source) }
              ]} />
            )}
          </View>
        )}

        {isSelected && hasBpm && (
          <Animated.View style={[styles.tooltip, { opacity: tooltipAnim }]}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle} numberOfLines={1}>{t('hearts.HeartRateTooltip')}</Text>
              <Text style={styles.tooltipWeight}>
                {item.bpm}{" "}
                <Text style={{ fontSize: 16, color: "#D53E4F" }}>BPM</Text>
              </Text>
              <Text style={styles.tooltipDate}>{formatDate(item.date)}</Text>
              {item.source && (
                <Text style={[styles.tooltipSource, { color: getSourceColor(item.source) }]}>
                  {item.source === 'apple' ? 'Apple Health' : 'Fitbit'}
                </Text>
              )}
            </View>
            <View style={styles.tooltipArrow} />
          </Animated.View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('hearts.HeartRate')}</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.heartRateContainer}>
          <HeartCard bpm={currentHeartRate} />
        </View>

        {/* Health App connection for iOS */}
        {Platform.OS === 'ios' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t('hearts.ConnectToApplication')}</Text>
            <View style={styles.connectItem}>
              <Image source={require("../../assets/images/applehealth.png")} style={{ width: 24, height: 24 }} />
              <Text style={styles.connectText}>Health app</Text>
              <TouchableOpacity onPress={handleAppleHealthConnection}>
                <Text style={styles.connectButton}>
                  {appleLoading ? t('actions.Connecting') : appleConnected ? t('actions.Disconnect') : t('actions.Connect')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Fitbit connection for Android only */}
        {Platform.OS === 'android' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t('hearts.ConnectToDevice')}</Text>
            <View style={styles.connectItem}>
              <Image source={require("../../assets/images/fitbit.png")} style={{ width: 24, height: 24 }} />
              <Text style={styles.connectText}>Fitbit</Text>
              <TouchableOpacity onPress={handleFitbitConnection}>
                <Text style={styles.connectButton}>
                  {fitbitLoading ? t('actions.Connecting') : fitbitConnected ? t('actions.Disconnect') : t('actions.Connect')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isAnyConnected && (
          <>
            <View style={styles.analysisSection}>
              <View style={styles.analysisHeader}>
                <View style={styles.analysisTab}>
                  <MaterialIcons name="bar-chart" size={18} color="#F2C3C8" />
                  <Text style={styles.analysisTabText}>{t('hearts.Analysis')}</Text>
                </View>
                <TouchableOpacity
                  ref={periodSelectorRef}
                  style={styles.periodSelector}
                  onPress={() => {
                    if (periodSelectorRef.current) {
                      periodSelectorRef.current.measure((x: any, y: any, width: number, height: any, pageX: any, pageY: any) => {
                        setDropdownPosition({
                          top: pageY + height-8,
                          right: width > 0 ? Dimensions.get("window").width - (pageX + width) : 20,
                        })
                        setDropdownVisible(true)
                      })
                    } else {
                      setDropdownVisible(true)
                    }
                  }}
                >
                  <Text style={styles.periodText}>{getTimeRangeLabel()}</Text>
                  <Ionicons name="chevron-down" size={14} color="#D53E4F" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.customChartContainer}>
              <View style={styles.yAxisContainer}>
                {yAxisLabels.map((label, index) => (
                  <Text key={index} style={styles.yAxisLabel}>
                    {label}
                  </Text>
                ))}
              </View>

              <View style={styles.chartContainer}>
                {yAxisLabels.map((_, index) => (
                  <View key={index} style={[styles.gridLine, { top: (index / (yAxisLabels.length - 1)) * MAX_HEIGHT }]} />
                ))}

                {timeRange !== "week" && timeRange !== "today" && (
                  <View style={styles.dateLabelsContainer}>
                    {filteredData
                      .filter((item) => item.isRangeLabel)
                      .map((item, index) => (
                        <Text key={index} style={styles.monthDateLabel}>
                          {item.day}
                        </Text>
                      ))}
                  </View>
                )}

                <View
                  style={[
                    styles.barsContainer,
                    timeRange === "today" && styles.todayBarsContainer,
                    timeRange !== "week" && timeRange !== "today" && { paddingHorizontal: 10 },
                  ]}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#D53E4F" />
                    </View>
                  ) : filteredData.length === 0 || !isAnyConnected ? (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>
                        {!isAnyConnected ? "Connect to a device to view heart rate data" : "No data available"}
                      </Text>
                    </View>
                  ) : (
                    filteredData
                      .filter((item) => timeRange === "week" || timeRange === "today" || !item.isRangeLabel)
                      .map((item, index) => (
                        <CustomBar
                          key={index}
                          item={item}
                          index={filteredData.findIndex((d) => d.date === item.date)}
                          isSelected={selectedIndex === filteredData.findIndex((d) => d.date === item.date)}
                          roundedMax={roundedMax}
                          roundedMin={roundedMin}
                          timeRange={timeRange}
                        />
                      ))
                  )}
                </View>
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomContainer}>
          <View style={styles.messageContainer}>
            <Text style={styles.messageTitle}>{t('hearts.MonitorYourHeartHealth')}</Text>
            <Text style={styles.messageSubtitle} numberOfLines={1}>
              {!isAnyConnected 
                ? "Connect to a device to start monitoring your heart rate" 
                : t('hearts.SetReminderSubtitle')
              }
            </Text>
          </View>
          {isAnyConnected && (
            <TouchableOpacity style={styles.reminderButton} onPress={()=>router.push({
                          pathname: '/patient/settings/reminder',
                          params: { type: 'heart' }
                        })}>
              <Ionicons name="alarm" size={16} color="white" />
              <Text style={styles.reminderButtonText} numberOfLines={1}>{t('hearts.SetReminder')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {isAnyConnected && (
        <Modal
          transparent={true}
          visible={dropdownVisible}
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDropdownVisible(false)}>
            <View style={[styles.dropdownContainer, { top: dropdownPosition.top, right: dropdownPosition.right }]}>
              {timeRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.dropdownItem, timeRange === option.id && styles.dropdownItemSelected]}
                  onPress={() => {
                    setTimeRange(option.id)
                    setDropdownVisible(false)
                  }}
                >
                  <Text style={[styles.dropdownItemText, timeRange === option.id && styles.dropdownItemTextSelected]}>
                    {option.label}
                  </Text>
                  {timeRange === option.id && <Ionicons name="checkmark" size={16} color="#D53E4F" />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
  },
  menuButton: {
    padding: 8,
  },
  heartRateContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  customChartContainer: {
    flexDirection: "row",
    marginTop: 10,
    height: MAX_HEIGHT + 40,
    marginRight: 16,
  },
  yAxisContainer: {
    width: 40,
    height: MAX_HEIGHT,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 5,
  },
  yAxisLabel: {
    color: "#AAAAAA",
    fontSize: 12,
    fontFamily: "Inter400",
  },
  chartContainer: {
    flex: 1,
    height: MAX_HEIGHT,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    paddingLeft: SPACING,
  },
  todayBarsContainer: {
    justifyContent: "center",
    paddingLeft: 0,
  },
  barContainer: {
    width: BAR_WIDTH,
    marginRight: SPACING,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barWrapper: {
    width: BAR_WIDTH,
    borderRadius: 0,
    overflow: "hidden",
    position: "relative",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  sourceIndicator: {
    position: "absolute",
    top: -3,
    right: -1,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "white",
  },
  barLabelContainer: {
    position: "absolute",
    bottom: -25,
    alignItems: "center",
  },
  barLabel: {
    fontSize: 14,
    color: "#888888",
    fontFamily: "Inter400",
  },
  tooltip: {
    position: "absolute",
    top: -70,
    alignItems: "center",
    width: 140,
    zIndex: 10,
  },
  tooltipContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#D53E4F",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#D53E4F",
    marginTop: -1,
  },
  tooltipTitle: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  tooltipWeight: {
    fontSize: 22,
    color: "#D53E4F",
    marginVertical: 2,
    fontFamily: "Inter700",
  },
  tooltipDate: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  tooltipSource: {
    fontSize: 10,
    fontFamily: "Inter400",
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBECED",
    borderWidth: 1,
    borderColor: "#F2C3C8",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    letterSpacing: 0.28,
    fontFamily: "Inter500",
    color: "#D53E4F",
  },
  analysisSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  analysisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  analysisTab: {
    flexDirection: "row",
    alignItems: "center",
  },
  analysisTabText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#333",
    letterSpacing: 0.28,
    fontFamily: "Inter400",
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "android" ? "auto" : 5,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 14,
    color: "#D53E4F",
    textTransform: "capitalize",
    fontFamily: "Inter500",
  },
  messageSubtitle: {
    fontSize: 12,
    color: "#7B7B7B",
    fontFamily: "Inter400",
  },
  reminderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D53E4F",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#F2C3C8",
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  reminderButtonText: {
    color: "#FEF8FD",
    marginLeft: 8,
    maxWidth: 130,
    fontSize: 12,
    fontFamily: "Inter500",
  },
  sectionContainer: {
    marginTop: 10,
    paddingHorizontal: 25,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#000",
    lineHeight: 22,
    fontFamily: "Inter600",
  },
  connectItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingBottom: 10,
    paddingTop: 15,
    gap: 5,
  },
  connectText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter600",
    color: "#0C0C0C",
  },
  connectButton: {
    color: "#D53E4F",
    fontSize: 14,
    fontFamily: "Inter600",
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: MAX_HEIGHT,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: MAX_HEIGHT,
  },
  noDataText: {
    color: "#999",
    fontFamily: "Inter400",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  dateRangeContainer: {
    alignItems: "center",
    width: 20,
    height: "100%",
  },
  dateRangeLabel: {
    position: "absolute",
    bottom: -25,
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter500",
  },
  dateLabelsContainer: {
    position: "absolute",
    bottom: -25,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  monthDateLabel: {
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F2C3C8",
    width: 160,
    overflow: "hidden",
    shadowColor: "#000",
    marginTop: -25,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(213, 62, 79, 0.1)",
  },
  dropdownItemSelected: {
    backgroundColor: "#FBECED",
  },
  dropdownItemText: {
    color: "#373737",
    fontSize: 14,
    fontFamily: "Inter400",
  },
  dropdownItemTextSelected: {
    color: "#D53E4F",
    fontFamily: "Inter600",
  },
})