import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, ActivityIndicator, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import SleepLogModal from "./modal/sleepmodal";
import SleepConflictModal from "./modal/sleepconflictmodal";
import { useFitbit } from "@/zustandStore/useFitbitStore";
import { useAppleHealth } from "@/zustandStore/useAppleHealthStore";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { useAuthDialog } from "@/components/ui/AuthDialog";
import { Pill } from "@/components/vitals/VitalsUI";
import {
  AddReadingButton,
  ChartCard,
  GuideNote,
  metricParts,
  metricStyles,
  periodAxis,
  periodWindow,
  RangeBarsChart,
  SectionLabel,
} from "@/components/vitals/MetricUI";

interface ChartDataEntry {
  day: string;
  hours: number;
  date: string;
  isRangeLabel?: boolean;
  rangeLabel?: string;
  id?: string;
}

interface SleepEntry {
  id: string;
  date: string;
  sleepStart: string;
  sleepEnd: string;
  duration: string;
}

// Time range options
type TimeRangeOption = {
  id: string;
  label: string;
};

const emptyChartData = [
  { day: "S", hours: 0, date: "" },
  { day: "M", hours: 0, date: "" },
  { day: "T", hours: 0, date: "" },
  { day: "W", hours: 0, date: "" },
  { day: "T", hours: 0, date: "" },
  { day: "F", hours: 0, date: "" },
  { day: "S", hours: 0, date: "" },
];

// Default empty today data
const emptyTodayData = [
  { day: "Today", hours: 0, date: new Date().toISOString().split("T")[0] },
];

export default function TrackSleepScreen() {
  // Mock data for the weekly chart
  const [logAdded, setLogAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tooltipAnim] = useState(new Animated.Value(0)); // Start with 0 opacity
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sleepLogs, setSleepLogs] = useState<SleepEntry[]>([]);
  const [chartData, setChartData] = useState<ChartDataEntry[]>(emptyChartData);
  const [lastResetDate, setLastResetDate] = useState<Date | null>(null);
  const [timeRange, setTimeRange] = useState("week"); // "today", "week", "month", "lastMonth"
  const [filteredData, setFilteredData] = useState<ChartDataEntry[]>([]);
  const { t, i18n } = useTranslation();

  const timeRangeOptions: TimeRangeOption[] = [
    { id: "today", label: t("sleepScreen.today") },
    { id: "week", label: t("sleepScreen.week") },
    { id: "month", label: t("sleepScreen.month") },
    { id: "lastMonth", label: t("sleepScreen.lastMonth") },
  ];

  // Dropdown state
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const periodSelectorRef = useRef<View>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
    width: 0,
  });

  // Fitbit hook (for Android)
  const {
    isConnected: fitbitConnected,
    isLoading: fitbitLoading,
    connect: fitbitConnect,
    disconnect: fitbitDisconnect,
    getSleepData: fitbitGetSleepData,
    getSleepDataForRange: fitbitGetSleepDataForRange,
  } = useFitbit();

  // Apple Health hook (for iOS)
  const {
    isConnected: appleHealthConnected,
    isLoading: appleHealthLoading,
    connect: appleHealthConnect,
    disconnect: appleHealthDisconnect,
    getSleepData: appleHealthGetSleepData,
    getSleepDataForRange: appleHealthGetSleepDataForRange,
    syncSleepWithBackend: appleHealthSyncSleep,
  } = useAppleHealth();

  // Determine which health service to use based on platform
  const isUsingAppleHealth = Platform.OS === 'ios';
  const healthServiceConnected = isUsingAppleHealth ? appleHealthConnected : fitbitConnected;
  const healthServiceLoading = isUsingAppleHealth ? appleHealthLoading : fitbitLoading;

  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Conflict modal state
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [conflictingLog, setConflictingLog] = useState<SleepEntry | null>(null);
  const [newLogTime, setNewLogTime] = useState<{
    sleepStart: string;
    sleepEnd: string;
  }>({
    sleepStart: "",
    sleepEnd: "",
  });

  useEffect(() => {
    const checkInitialConnection = async () => {
      try {
        // Wait for the hook's connection check to complete
        await new Promise((resolve) => setTimeout(resolve, 500));
        setInitialCheckDone(true);
      } catch (error) {
        console.error("Error in initial connection check:", error);
        setInitialCheckDone(true);
      }
    };

    checkInitialConnection();
  }, []);

  useEffect(() => {
    const fetchSleepData = async () => {
      console.log(`Time range changed to: ${timeRange}`);
      if (healthServiceConnected) {
        // Refresh health data when time range changes
        await getSleepStatus();
      }
    };

    fetchSleepData();
  }, [timeRange, healthServiceConnected]);

  const handleHealthConnection = async () => {
    if (isUsingAppleHealth) {
      if (appleHealthConnected) {
        // Disconnect from Apple Health
        await appleHealthDisconnect();
        Alert.alert("Disconnected", "Successfully disconnected from Apple Health");
      
      } else {
        // Connect to Apple Health
        const success = await appleHealthConnect();
        if (success) {
          Alert.alert("Success", "Connected to Apple Health");
          getSleepStatus(); // Refresh data with Apple Health data
        } else {
          Alert.alert("Error", "Failed to connect to Apple Health");
        }
      }
    } else {
      // Existing Fitbit logic
      if (fitbitConnected) {
        // Disconnect from Fitbit
        await fitbitDisconnect();
        Alert.alert("Disconnected", "Successfully disconnected from Fitbit");
        // Clear data when disconnected
       
      } else {
        // Connect to Fitbit
        const success = await fitbitConnect();
        if (success) {
          Alert.alert("Success", "Connected to Fitbit");
          getSleepStatus(); // Refresh data with Fitbit data
        } else {
          Alert.alert("Error", "Failed to connect to Fitbit");
        }
      }
    }
  };

  const user = useSelector((state: any) => state.user);

  // Helper function to format time in the exact format the backend expects
  const formatTimeForBackend = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    // Format minutes with leading zero if needed
    const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

    return `${hours}:${minutesStr} ${ampm}`;
  };

  const fetchHealthSleepData = async () => {
    try {
      console.log(`Fetching sleep data for time range: ${timeRange}`);

      // Use the appropriate health service based on platform
      let data;
      if (isUsingAppleHealth) {
        // Get data from Apple Health
        data = await appleHealthGetSleepDataForRange(timeRange);
        
        // Sync with backend for Apple Health
        if (user?.user_id) {
          await appleHealthSyncSleep(user.user_id);
        }
      } else {
        // Get data from Fitbit
        data = await fitbitGetSleepDataForRange(timeRange);
      }

      if (!data) {
        console.error(
          "Failed to fetch health sleep data - API returned null/undefined"
        );
        return null;
      }

      console.log("Health service sleep response received successfully");
      return processHealthSleepData(data);
    } catch (error) {
      console.error("Error fetching health sleep data:", error);
      return null;
    }
  };

  // Process health sleep data (works for both Fitbit and Apple Health)
  const processHealthSleepData = async (healthData: any) => {
    console.log(
      "Raw health sleep data received:",
      JSON.stringify(healthData, null, 2)
    );

    if (!healthData) {
      console.log("No health data received");
      return [];
    }

    if (!healthData.sleep) {
      console.log(
        "No sleep property in health data. Available properties:",
        Object.keys(healthData)
      );
      return [];
    }

    const sleepData = healthData.sleep;
    console.log(`Processing ${sleepData.length} sleep records`);

    const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"];
    const processedData = [];

    // Create a map to store sleep data by date
    const sleepByDate = new Map();

    // Process all sleep records
    for (const sleepRecord of sleepData) {
      try {
        // Get the date from the sleep record
        const dateStr = sleepRecord.dateOfSleep;
        const date = new Date(dateStr);

        // Validate the date is valid before proceeding
        if (isNaN(date.getTime())) {
          console.error("Invalid date from health service:", dateStr);
          continue; // Skip this record
        }

        const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayAbbr = fixedWeekdays[dayIndex];

        // Parse the timestamps
        const sleepStart = new Date(sleepRecord.startTime);
        const sleepEnd = new Date(sleepRecord.endTime);

        // Validate timestamps are valid
        if (isNaN(sleepStart.getTime()) || isNaN(sleepEnd.getTime())) {
          console.error(
            "Invalid timestamps from health service:",
            sleepRecord.startTime,
            sleepRecord.endTime
          );
          continue; // Skip this record
        }

        // Format times for display in 12-hour format using our reliable formatter
        const formattedSleepStart = formatTimeForBackend(sleepStart);
        const formattedSleepEnd = formatTimeForBackend(sleepEnd);

        console.log("Formatted times:", {
          original_start: sleepRecord.startTime,
          original_end: sleepRecord.endTime,
          formatted_start: formattedSleepStart,
          formatted_end: formattedSleepEnd,
          start_parts: formattedSleepStart.split(" "),
          end_parts: formattedSleepEnd.split(" "),
        });

        // Calculate sleep duration in hours
        const durationMs = sleepRecord.duration;
        const hours = durationMs / (1000 * 60 * 60);

        // Format duration for display
        const durationHours = Math.floor(hours);
        const durationMinutes = Math.round((hours - durationHours) * 60);
        const formattedDuration = `${durationHours} hr${
          durationMinutes > 0 ? ` ${durationMinutes} min` : ""
        }`;

        // Format the date for display - use a more reliable format
        const formattedDate = `${date.getDate()} ${date.toLocaleString(
          "en-US",
          { month: "short" }
        )}, ${date.getFullYear()}`;

        // Send data to your API
        try {
          // Prepare data in the format your API expects
          const sleepDataForAPI = {
            date: dateStr, // Format: YYYY-MM-DD
            sleepStart: formattedSleepStart, // Format: "9:00 PM"
            sleepEnd: formattedSleepEnd, // Format: "7:29 AM"
            // Note: Don't send duration - backend calculates it automatically
          };

          console.log("Sending sleep data to API:", sleepDataForAPI);

          // Make POST request to your API
          const response = await fetch(
            `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/sleep`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(sleepDataForAPI),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error Response: ${errorText}`);
            throw new Error(
              `Failed to save sleep data: ${response.status} ${response.statusText}`
            );
          }

          const responseData = await response.json();
          console.log(
            `Successfully saved sleep data for ${dateStr}:`,
            responseData
          );
        } catch (error) {
          console.error("Error saving sleep data to database:", error);
          // Continue processing even if API call fails
        }

        // Continue with your existing code for processing the data for the UI
        if (sleepByDate.has(dateStr)) {
          const existingEntry = sleepByDate.get(dateStr);
          existingEntry.hours += hours;

          // Add to sleep logs
          existingEntry.logs.push({
            id: sleepRecord.logId.toString(),
            date: formattedDate, // Use the formatted date here
            sleepStart: formattedSleepStart,
            sleepEnd: formattedSleepEnd,
            duration: formattedDuration,
          });
        } else {
          // Create a new entry
          sleepByDate.set(dateStr, {
            day: dayAbbr,
            hours: hours,
            date: dateStr,
            displayDate: formattedDate, // Add formatted date for display
            logs: [
              {
                id: sleepRecord.logId.toString(),
                date: formattedDate, // Use the formatted date here
                sleepStart: formattedSleepStart,
                sleepEnd: formattedSleepEnd,
                duration: formattedDuration,
              },
            ],
          });
        }
      } catch (error) {
        console.error("Error processing sleep record:", error);
        // Continue to the next record
      }
    }

    // Convert map to array
    return Array.from(sleepByDate.values());
  };

  const [isModalVisible, setIsModalVisible] = useState(false);

  // Get the current selected time range label
  const getTimeRangeLabel = () => {
    const option = timeRangeOptions.find((option) => option.id === timeRange);
    return option ? option.label : "Last 7 Days";
  };

  // Generate all days for the selected time range
  const generateAllDays = (timeRange: string): ChartDataEntry[] => {
    const today = new Date();
    const days = [];
    let startDate: Date;
    let endDate: Date;

    if (timeRange === "today") {
      // Today view - just show today
      const todayStr = today.toISOString().split("T")[0];
      const dayName = today.toLocaleDateString("en-US", { weekday: "long" });

      return [
        {
          id: `today-${todayStr}`,
          date: todayStr,
          day: t("sleepScreen.today"),
          hours: 0,
        },
      ];
    } else if (timeRange === "week") {
      // Weekly view - show each day
      startDate = new Date(today);
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split("T")[0];
        days.push({
          id: `empty-${dateString}`,
          date: dateString,
          day: currentDate
            .toLocaleDateString("en-US", { weekday: "short" })
            .charAt(0),
          hours: 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (timeRange === "month" || timeRange === "lastMonth") {
      // For month views, create date ranges around key dates
      const dateRanges = [
        { label: "1", start: 1, end: 4 },
        { label: "5", start: 5, end: 9 },
        { label: "10", start: 10, end: 14 },
        { label: "15", start: 15, end: 19 },
        { label: "20", start: 20, end: 24 },
        { label: "25", start: 25, end: 29 },
        { label: "30", start: 30, end: 31 },
      ];

      if (timeRange === "month") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      } else {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      }

      const lastDay = endDate.getDate();

      // Generate entries for each date range
      for (const range of dateRanges) {
        if (range.start <= lastDay) {
          // Add the main label date
          const labelDate = new Date(startDate);
          labelDate.setDate(range.start);
          const labelDateString = labelDate.toISOString().split("T")[0];

          days.push({
            id: `label-${labelDateString}`,
            date: labelDateString,
            day: range.label,
            hours: 0,
            isRangeLabel: true, // Mark this as a label for the range
          });

          // Add individual days in the range
          for (
            let day = range.start;
            day <= Math.min(range.end, lastDay);
            day++
          ) {
            const currentDate = new Date(startDate);
            currentDate.setDate(day);
            const dateString = currentDate.toISOString().split("T")[0];

            days.push({
              id: `day-${dateString}`,
              date: dateString,
              day: "", // Empty string for non-label days
              hours: 0,
              rangeLabel: range.label, // Reference to which label this belongs to
            });
          }
        }
      }
    }

    return days;
  };

  // Function to get the current week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Function to check if we need to reset the chart data
  const checkAndResetWeeklyData = async () => {
    try {
      // Get current date
      const currentDate = new Date();
      const currentWeek = getWeekNumber(currentDate);
      const currentYear = currentDate.getFullYear();

      // Get the stored last reset info from AsyncStorage
      const lastResetInfo = await AsyncStorage.getItem("lastChartResetInfo");
      let lastResetWeek = 0;
      let lastResetYear = 0;

      if (lastResetInfo) {
        const parsedInfo = JSON.parse(lastResetInfo);
        lastResetWeek = parsedInfo.week;
        lastResetYear = parsedInfo.year;
        setLastResetDate(new Date(parsedInfo.date));
      }

      console.log("Current week/year:", currentWeek, currentYear);
      console.log("Last reset week/year:", lastResetWeek, lastResetYear);

      // Reset if it's a new week or a new year
      if (
        !lastResetInfo ||
        lastResetWeek !== currentWeek ||
        lastResetYear !== currentYear
      ) {
        console.log("Resetting chart data for new week");

        // Reset chart data
        setChartData(emptyChartData);

        // Store the current week info
        const resetInfo = {
          week: currentWeek,
          year: currentYear,
          date: currentDate.toISOString(),
        };

        await AsyncStorage.setItem(
          "lastChartResetInfo",
          JSON.stringify(resetInfo)
        );
        setLastResetDate(currentDate);

        return true; // Indicate that we reset the data
      }

      return false; // No reset needed
    } catch (error) {
      console.error("Error in checkAndResetWeeklyData:", error);
      return false;
    }
  };

  // Add these functions to handle the modal
  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSaveSleepLog = (date: Date, sleepTime: Date, wakeTime: Date) => {
    // Format the times for display using toLocaleTimeString
    const formattedSleepTime = sleepTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const formattedWakeTime = wakeTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Check for overlaps with existing logs
    const conflictingLog = detectSleepOverlap(sleepTime, wakeTime, sleepLogs);

    if (conflictingLog) {
      // Show conflict modal
      setConflictingLog(conflictingLog);
      setNewLogTime({
        sleepStart: formattedSleepTime,
        sleepEnd: formattedWakeTime,
      });
      setConflictModalVisible(true);
      return; // Don't save the log
    }

    // Calculate duration (this is a simple calculation, might need adjustment)
    const sleepMs = sleepTime.getTime();
    const wakeMs = wakeTime.getTime();
    let durationMs = wakeMs - sleepMs;

    // If wake time is earlier than sleep time, assume it's the next day
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000;
    }

    const durationHours = Math.floor(durationMs / (60 * 60 * 1000));
    const durationMinutes = Math.floor(
      (durationMs % (60 * 60 * 1000)) / (60 * 1000)
    );

    const formattedDuration = `${durationHours} hr${
      durationMinutes > 0 ? ` ${durationMinutes} min` : ""
    }`;

    // Format the date using toLocaleDateString
    const formattedDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Create a new sleep entry
    const newEntry: SleepEntry = {
      id: (sleepLogs.length + 1).toString(),
      date: formattedDate,
      sleepStart: formattedSleepTime,
      sleepEnd: formattedWakeTime,
      duration: formattedDuration,
    };

    // Add the new entry to the sleep data
    setSleepLogs((prevLogs) => [newEntry, ...prevLogs]);
    setIsModalVisible(false);

    // Refresh the chart data
    getSleepStatus();
  };

  // Process and filter data based on time range
  const processDataForTimeRange = (data: any[], timeRange: string) => {
    const allDays = generateAllDays(timeRange);

    if (data.length === 0) {
      return allDays;
    }

    const dataMap = new Map();
    data.forEach((item) => {
      if (item.date) {
        const dateKey = new Date(item.date).toISOString().split("T")[0];
        dataMap.set(dateKey, item);
      }
    });

    // For "today" view, we need to specifically check if today's data exists
    if (timeRange === "today") {
      const todayStr = new Date().toISOString().split("T")[0];
      const todayData = dataMap.get(todayStr);

      if (todayData) {
        return [
          {
            id: `today-${todayStr}`,
            date: todayStr,
            day: t("sleepScreen.today"),
            hours: todayData.hours || 0,
          },
        ];
      } else {
        return allDays; // Return empty today template
      }
    }

    // For other views, map the data as before
    return allDays.map((day) => {
      const existingData = dataMap.get(day.date);
      if (existingData) {
        return {
          ...day,
          hours: existingData.hours || 0,
          isRangeLabel: day.isRangeLabel,
          rangeLabel: day.rangeLabel,
        };
      }
      return day;
    });
  };

  const getSleepStatus = async () => {
    setLoading(true); // Show loader
    try {
      // Check if we need to reset weekly data first
      const wasReset = await checkAndResetWeeklyData();

      // If we just reset the data, we might want to show empty chart initially
      if (wasReset) {
        console.log("Chart was reset, showing empty data");
      }

      let allSleepLogs: SleepEntry[] = [];
      let chartDataFromHealth: any[] = [];

      // Only process health data if actually connected
      if (healthServiceConnected) {
        console.log("Fetching sleep data from health service...");
        // Get sleep data from health service
        const healthData = await fetchHealthSleepData();

        if (healthData && healthData.length > 0) {
          console.log("Processing health sleep data:", healthData);

          // Extract sleep logs from the processed data
          const sleepLogsFromHealth: SleepEntry[] = [];
          healthData.forEach((item) => {
            if (item.logs && item.logs.length > 0) {
              sleepLogsFromHealth.push(...item.logs);
            }
          });

          // Set chart data from health service
          chartDataFromHealth = healthData;
          allSleepLogs = sleepLogsFromHealth;

          console.log("Health service sleep logs:", sleepLogsFromHealth);
        }
      } else {
        console.log("Not connected to health service, skipping health data fetch");
      }

      // Fetch data from backend
      try {
        console.log("Fetching sleep data from backend...");
        const response = await fetch(
          `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/sleepstatus`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Backend sleep data:", data.sleepData);

          if (data.sleepData && data.sleepData.length > 0) {
            if (healthServiceConnected) {
              // If connected to health service, we need to merge data carefully to avoid duplicates
              // Create a Set of dates that already exist in health data
              const healthDates = new Set(
                allSleepLogs
                  .map((log) => {
                    // Convert display date back to YYYY-MM-DD format for comparison
                    const dateParts = log.date.split(" ");
                    if (dateParts.length >= 3) {
                      const day = dateParts[0];
                      const month = dateParts[1].replace(",", "");
                      const year = dateParts[2];

                      // Convert month name to number
                      const monthNames = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ];
                      const monthNum = monthNames.indexOf(month) + 1;

                      if (monthNum > 0) {
                        return `${year}-${monthNum
                          .toString()
                          .padStart(2, "0")}-${day.padStart(2, "0")}`;
                      }
                    }
                    return null;
                  })
                  .filter(Boolean)
              );

              // Only add backend logs that don't exist in health data
              const uniqueBackendLogs = data.sleepData.filter(
                (backendLog: any) => !healthDates.has(backendLog.date)
              );

              allSleepLogs = [...allSleepLogs, ...uniqueBackendLogs];
              console.log(
                `Added ${uniqueBackendLogs.length} unique backend logs to ${
                  allSleepLogs.length - uniqueBackendLogs.length
                } health logs`
              );
            } else {
              // If not connected to health service, just use backend data
              allSleepLogs = data.sleepData;
              console.log(`Using ${allSleepLogs.length} backend logs only`);
            }

            // Process backend data for chart if no health data
            if (chartDataFromHealth.length === 0) {
              const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"];
              const fullWeekdays = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ];

              // Create a map to store unique sleep data
              const sleepMap = new Map();

              // Process backend data for chart
              data.sleepData.forEach(
                (entry: { date: string | number | Date; duration: string }) => {
                  const entryDate = new Date(entry.date);
                  const fullDay = entryDate.toLocaleString("en-US", {
                    weekday: "long",
                  });
                  const dayIndex = fullWeekdays.indexOf(fullDay);

                  if (dayIndex === -1) return;

                  const dayLetter = fixedWeekdays[dayIndex];

                  // Extract sleep duration
                  let hours = 0;
                  let minutes = 0;

                  if (entry.duration) {
                    const durationParts = entry.duration.split(" ");
                    if (durationParts.length >= 1) {
                      hours = Number.parseFloat(durationParts[0]) || 0;
                    }
                    if (durationParts.length >= 3) {
                      minutes = Number.parseFloat(durationParts[2]) || 0;
                    }
                  }

                  const totalHours = hours + minutes / 60;
                  const dateString = entryDate.toISOString().split("T")[0];

                  sleepMap.set(dateString, {
                    day: dayLetter,
                    hours: totalHours,
                    date: dateString,
                  });
                }
              );

              chartDataFromHealth = Array.from(sleepMap.values());
            }
          }
        }
      } catch (backendError) {
        console.error("Error fetching backend sleep data:", backendError);
        // Continue with health data only (if any)
      }

      // Set all sleep logs (Health + Backend, with duplicates removed)
      setSleepLogs(allSleepLogs);
      setChartData(chartDataFromHealth);

      // Process data for current time range
      const filteredData = processDataForTimeRange(
        chartDataFromHealth,
        timeRange
      );
      setFilteredData(filteredData);

      console.log("Final combined sleep data:", {
        isConnected: healthServiceConnected,
        logs: allSleepLogs.length,
        chartData: chartDataFromHealth.length,
        filteredData: filteredData.length,
      });
    } catch (error) {
      console.error("Error fetching sleep data:", error);

      // If there's an error, still set filtered data based on time range
      const filteredData = processDataForTimeRange([], timeRange);
      setFilteredData(filteredData);
    } finally {
      setLoading(false); // Hide loader
    }
  };

  // Update filtered data when time range changes
  useEffect(() => {
    const filtered = processDataForTimeRange(chartData, timeRange);
    setFilteredData(filtered);

    // Reset selected index when changing time range
    setSelectedIndex(null);
  }, [timeRange, chartData]);

  // Initialize data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      // Load the last reset date from storage
      const lastResetInfo = await AsyncStorage.getItem("lastChartResetInfo");
      if (lastResetInfo) {
        const parsedInfo = JSON.parse(lastResetInfo);
        setLastResetDate(new Date(parsedInfo.date));
      }

      // Check for reset and fetch data
      await getSleepStatus();
    };

    initializeData();

    // Set up a check that runs when the app is opened or comes to foreground
    const checkInterval = setInterval(() => {
      checkAndResetWeeklyData().then((wasReset) => {
        if (wasReset) {
          // If data was reset, refresh the sleep status
          getSleepStatus();
        }
      });
    }, 60000); // Check every hour

    return () => clearInterval(checkInterval);
  }, []);

  const handleDeleteLog = async (id: string) => {
    console.log(id);
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/sleepstatus/delete/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    console.log(data);
    setSleepLogs(sleepLogs.filter((log) => log.id !== id));

    // Refresh chart data after deletion
    getSleepStatus();
  };

  // ✅ Convert "10.0" to "10 hr 0 min" format
  const formatDuration = (duration: string | null | undefined) => {
    if (!duration) return "0 hr 0 min"; // Default if missing
    const totalMinutes = Number.parseFloat(duration) * 60;
    if (isNaN(totalMinutes)) return "0 hr 0 min"; // Handle invalid numbers

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  };

  // ✅ Convert "03/08/2025" to "08 March, 25"
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      // A bare YYYY-MM-DD is a calendar day: read it at local noon so it does not slip to the day before
      const date = /^\d{4}-\d{2}-\d{2}/.test(dateString)
        ? new Date(`${dateString.slice(0, 10)}T12:00:00`)
        : new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return ""; // Return empty string for invalid dates
      }

      // Format using a more reliable method
      return `${date.getDate()} ${date.toLocaleString("en-US", {
        month: "short",
      })}, ${date.getFullYear()}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return ""; // Return empty string on error
    }
  };

  // Calculate y-axis values using useMemo to prevent recalculation on every render
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    // Filter out zero values for calculation
    const nonZeroValues = filteredData
      .filter((item) => !item.isRangeLabel && item.hours > 0)
      .map((item) => item.hours);

    // If no non-zero values, use default range
    if (nonZeroValues.length === 0) {
      return {
        yAxisLabels: [10, 8, 6, 4, 2, 0],
        roundedMax: 10,
        roundedMin: 0,
      };
    }

    const maxWeight = Math.max(...nonZeroValues);
    const minWeight = Math.min(...nonZeroValues);

    // Add padding to the range - increase the padding for the max value
    const paddedMax = maxWeight * 1.1; // Add 10% padding to max value
    const paddedMin = Math.max(0, minWeight - 1);

    // Calculate rounded max for y-axis (round up to nearest 1)
    const roundedMax = Math.ceil(paddedMax);
    // Calculate rounded min for y-axis (round down to nearest 1)
    const roundedMin = Math.floor(paddedMin);

    // Create appropriate y-axis labels based on data range
    const range = roundedMax - roundedMin;
    const step = Math.max(1, Math.ceil(range / 5)); // We want about 5 labels, minimum step of 1

    const labels = [];
    for (let i = 0; i <= 5; i++) {
      const value = roundedMin + step * i;
      if (value <= roundedMax) {
        labels.push(value);
      }
    }

    // Make sure max value is included
    if (labels[labels.length - 1] < roundedMax) {
      labels.push(roundedMax);
    }

    return {
      yAxisLabels: labels.reverse(), // Reverse for top-to-bottom display
      roundedMax,
      roundedMin,
    };
  }, [filteredData]); // Recalculate when filtered data changes

  // Function to hide tooltip after a delay
  const hideTooltipAfterDelay = () => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    // Set a new timeout to hide the tooltip after 3 seconds
    tooltipTimeoutRef.current = setTimeout(() => {
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSelectedIndex(null);
      });
    }, 3000);
  };

  const handleBarPress = (index: number): void => {
    // Get the actual item
    const item = filteredData[index];

    // Skip if it's a range label or has no data
    if (item.isRangeLabel || item.hours <= 0) {
      return;
    }

    if (selectedIndex === index) {
      setSelectedIndex(null); // Deselect if already selected
      return;
    }

    // Animate tooltip disappearing and reappearing
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
    ]).start();

    setSelectedIndex(index);

    // Set timeout to hide tooltip after delay
    hideTooltipAfterDelay();
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  const detectSleepOverlap = (
    newSleepStart: Date,
    newSleepEnd: Date,
    existingLogs: SleepEntry[]
  ) => {
    for (const log of existingLogs) {
      try {
        // Parse existing log times
        const existingSleepStart = parseTimeString(log.sleepStart, log.date);
        const existingSleepEnd = parseTimeString(log.sleepEnd, log.date);

        if (!existingSleepStart || !existingSleepEnd) {
          continue; // Skip invalid entries
        }

        // Check for overlap
        // Overlap occurs if: (start1 < end2) AND (start2 < end1)
        const hasOverlap =
          newSleepStart < existingSleepEnd && existingSleepStart < newSleepEnd;

        if (hasOverlap) {
          return log; // Return the conflicting log
        }
      } catch (error) {
        console.error("Error checking overlap for log:", log, error);
        continue;
      }
    }

    return null; // No overlap found
  };

  // Helper function to parse time strings with date context
  const parseTimeString = (timeString: string, dateString: string) => {
    try {
      // Parse the base date
      const baseDate = new Date(dateString);
      if (isNaN(baseDate.getTime())) {
        return null;
      }

      // Parse time (e.g., "11:30 PM" or "7:30 AM")
      const timeParts = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeParts) {
        return null;
      }

      let hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      const period = timeParts[3].toUpperCase();

      // Convert to 24-hour format
      if (period === "PM" && hours !== 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }

      // Create the full datetime
      const fullDateTime = new Date(baseDate);
      fullDateTime.setHours(hours, minutes, 0, 0);

      // If it's a sleep end time and it's earlier in the day than typical sleep start,
      // assume it's the next day (e.g., sleep at 11 PM, wake at 7 AM next day)
      if (hours < 12 && timeString.includes("AM")) {
        // Check if this might be a wake-up time (typically early morning)
        // If the time is before noon, it might be the next day
        const sleepStartHour = 18; // Assume sleep typically starts after 6 PM
        if (hours < sleepStartHour) {
          fullDateTime.setDate(fullDateTime.getDate() + 1);
        }
      }

      return fullDateTime;
    } catch (error) {
      console.error(
        "Error parsing time string:",
        timeString,
        dateString,
        error
      );
      return null;
    }
  };

  const { dialog, show } = useAuthDialog();
  const week = periodWindow("7");
  const nights = filteredData.filter((item) => !item.isRangeLabel && item.hours > 0 && item.date && week.contains(item.date));
  const average = nights.length ? nights.reduce((sum, item) => sum + item.hours, 0) / nights.length : 0;
  const avgHours = Math.floor(average);
  const avgMinutes = Math.round((average - avgHours) * 60);
  const enough = average >= 7;

  const confirmDelete = (id: string) =>
    show({
      variant: "delete",
      title: t("sleepLog.deleteTitle"),
      message: t("sleepLog.deleteBody"),
      buttons: [
        { text: t("cancel"), style: "cancel" },
        { text: t("sleepLog.deleteTitle"), onPress: () => handleDeleteLog(id) },
      ],
    });

  const device = isUsingAppleHealth
    ? { name: "Apple Health", image: require("../../assets/images/applehealth.png") }
    : { name: "Fitbit", image: require("../../assets/images/fitbit.png") };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("sleepLog.trackTitle")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          <View style={[metricParts.card, metricParts.hero, styles.hero]}>
            <Text style={metricParts.when}>{t("sleepLog.weekAverage")}</Text>
            {nights.length > 0 ? (
              <>
                <View style={styles.countRow}>
                  <Text style={metricParts.big}>{avgHours}</Text>
                  <Text style={metricParts.unit}>h</Text>
                  <Text style={metricParts.big}>{String(avgMinutes).padStart(2, "0")}</Text>
                  <Text style={metricParts.unit}>min</Text>
                </View>
                <View style={styles.pillRow}>
                  <Pill label={enough ? t("sleepLog.goodNight") : t("sleepLog.shortNight")} tone={enough ? "success" : "warning"} />
                </View>
              </>
            ) : (
              <Text style={styles.empty}>{t("sleepLog.noNights")}</Text>
            )}
          </View>

          <ChartCard axis={periodAxis("7", i18n.language)} legend={[{ mark: "line", label: t("sleepLog.legend") }]}>
            <RangeBarsChart
              bars={nights.map((item) => ({ x: week.x(item.date), high: item.hours, low: 0 }))}
              min={0}
              max={Math.max(10, ...nights.map((item) => item.hours)) + 1}
              band={[7, 9]}
              barWidth={14}
            />
          </ChartCard>

          <GuideNote text={t("sleepLog.guide")} />

          <SectionLabel>{t("sleepLog.recentNights")}</SectionLabel>
          {loading ? (
            <ActivityIndicator color={Theme.colors.magenta} />
          ) : sleepLogs.length === 0 ? (
            <Text style={styles.empty}>{t("sleepLog.noNights")}</Text>
          ) : (
            <View style={[metricParts.card, styles.list]}>
              {sleepLogs.map((entry, index) => (
                <View key={entry.id} style={[styles.row, index > 0 && styles.divider]}>
                  <View style={styles.iconChip}>
                    <Feather name="moon" size={17} color={Theme.colors.purple} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.rowTitle}>{entry.duration}</Text>
                    <Text style={styles.rowSub}>
                      {entry.date?.includes?.(",") ? entry.date : formatDate(entry.date)} · {entry.sleepStart} – {entry.sleepEnd}
                    </Text>
                  </View>
                  {!healthServiceConnected && (
                    <TouchableOpacity
                      onPress={() => confirmDelete(entry.id)}
                      accessibilityRole="button"
                      accessibilityLabel={t("sleepLog.deleteTitle")}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="trash-2" size={17} color={Theme.colors.inkFaint} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          <SectionLabel>{t("heartLog.devices")}</SectionLabel>
          <View style={[metricParts.card, styles.list]}>
            <View style={styles.row}>
              <View style={styles.iconChip}>
                <Image source={device.image} style={styles.deviceImage} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{device.name}</Text>
                <Text style={styles.rowSub}>
                  {healthServiceConnected ? t("heartLog.connected") : t("sleepLog.connectHint")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleHealthConnection}
                disabled={healthServiceLoading}
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.link}>
                  {healthServiceLoading
                    ? t("actions.Connecting")
                    : healthServiceConnected
                      ? t("actions.Disconnect")
                      : t("actions.Connect")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {!healthServiceConnected && <AddReadingButton label={t("sleepLog.addLog")} onPress={handleOpenModal} />}

        <SleepLogModal isVisible={isModalVisible} onClose={handleCloseModal} onSave={handleSaveSleepLog} reload={getSleepStatus} />

        <SleepConflictModal
          isVisible={conflictModalVisible}
          onClose={() => setConflictModalVisible(false)}
          conflictingLog={conflictingLog}
          newLogTime={newLogTime}
        />
        {dialog}
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  hero: {
    gap: 10,
  },
  pillRow: {
    flexDirection: "row",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  empty: {
    fontFamily: Theme.typography.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: Theme.colors.inkFaint,
  },
  list: {
    paddingHorizontal: Theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairlineLight,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceImage: {
    width: 22,
    height: 22,
  },
  rowTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  link: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.magenta,
  },
});
