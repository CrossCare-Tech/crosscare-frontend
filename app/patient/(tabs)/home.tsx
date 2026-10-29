import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useDispatch, useSelector } from "react-redux";
import { removeToken, setUser } from "@/store/userSlice";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar, Platform } from "react-native";
import Card from "@/components/Card";
import { useTranslation } from "react-i18next";
import "../../../translation/i18next";
import ProgressCircle from "@/components/ProgressCircle";
import { Image } from "react-native";
import FoodIcon from "@/assets/images/Svg/FoodIcon";
import WaterIcon from "@/assets/images/Svg/WaterIcon";
import StepsIcon from "@/assets/images/Svg/StepsIcon";
import Calendar from "@/assets/images/Svg/Calendar";
import { useWaterStore } from "@/zustandStore/waterStore";
import {
  useStepsStore,
  useStepsWithAutoRefresh,
} from "@/zustandStore/useStepsStore";
import User from "@/assets/images/Svg/User";
import * as ImagePicker from "expo-image-picker";
import { Linking } from "react-native";
import { useMealStore } from "@/zustandStore/mealStore";
import { CONFIG } from "@/constants/config";
import { useFitbit } from "@/zustandStore/useFitbitStore";
import { useAppleHealth } from "@/zustandStore/useAppleHealthStore";
import { demoWatchReaders, useDemoWatch, useDemoWatchActive } from "@/utils/demo/demoWatch";
import { useSelfCareStore } from "@/zustandStore/contentfulStores/selfCareStore";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from "react-native-svg";
import { Theme } from "@/constants/theme";
import { babyImageForWeek } from "@/constants/babyImages";
import { fruitForWeek } from "@/constants/babySize";
import ScreenBackground from "@/components/ui/ScreenBackground";
import LineIcon from "@/components/profile/LineIcon";
import { DueArt, FoodArt, GlucoseArt, PressureArt, StepsArt, WaterArt } from "@/components/home/TileArt";
import MoodCheckIn from "@/components/home/MoodCheckIn";


interface Progress {
  progressPercentage: number;
  remainingDays: number;
  dueDate: string;
}

const calculatePregnancyProgress = (pregnancyData: any): Progress => {
  const totalWeeks = 40; // Standard pregnancy duration (40 weeks)
  
  // If we have pregnancy data from backend, use it
  if (pregnancyData) {
    const currentWeek = pregnancyData.week || 0;
    const remainingDays = pregnancyData.remainingDays ?? 280;
    const dueDate = pregnancyData.dueDate || new Date().toISOString();
    
    // Calculate progress percentage
    const progressPercentage = (currentWeek / totalWeeks) * 100;
    
    // Format due date
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDueDate = new Date(dueDate).toLocaleDateString("en-US", options);
    
    return {
      progressPercentage,
      remainingDays,
      dueDate: formattedDueDate,
    };
  }
  
  // Fallback for when no pregnancy data is available
  const progressPercentage = 0;
  const remainingDays = 280;
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + remainingDays);
  
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDueDate = dueDate.toLocaleDateString("en-US", options);

  return {
    progressPercentage,
    remainingDays,
    dueDate: formattedDueDate,
  };
};  

const Home = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const token = useSelector((state: any) => state.user.token);
  const user = useSelector((state: any) => state.user);
  const { t, i18n } = useTranslation();
  const {
    calorieGoal,
    caloriesConsumed,
    goodFoodCount,
    badFoodCount
  } = useMealStore();
  const [weeksComplete, setWeeksComplete] = useState(0);
  const [pregnancyData, setPregnancyData] = useState<any>(null);
  const pregnancyProgress = React.useMemo(() => {
    return calculatePregnancyProgress(pregnancyData);
  }, [pregnancyData]);
  const [showPregnancyModal, setShowPregnancyModal] = useState(false);
  const { progressPercentage, remainingDays, dueDate } = pregnancyProgress;

  const { maxGlasses, glassCount } = useWaterStore();
  const { stepsWalked, stepGoal } = useStepsWithAutoRefresh(user?.user_id);

  // Add health service hooks
  const {
    isConnected: fitbitConnected,
    getStepsData: fitbitGetStepsData,
    getDataForRange: fitbitGetDataForRange,
  } = useFitbit();

  const {
    isConnected: appleHealthConnected,
    getStepsData: appleHealthGetStepsData,
    getDataForRange: appleHealthGetDataForRange,
    syncStepsWithBackend: appleHealthSyncSteps,
  } = useAppleHealth();

  // Determine which health service to use
  const isUsingAppleHealth = Platform.OS === 'ios';
  // The Demo Watch (Simulated data) counts as a connected health service while steps are allowed
  const watchActive = useDemoWatchActive();
  const watchAllowed = useDemoWatch((state) => state.permissions.steps);
  const healthServiceConnected = watchActive || (isUsingAppleHealth ? appleHealthConnected : fitbitConnected);

  const [foodQualityScore, setFoodQualityScore] = useState("50%");
  const [bpSystolic, setBpSystolic] = useState<number | null>(null);
  const [bpDiastolic, setBpDiastolic] = useState<number | null>(null);
  const [glucoseLevel, setGlucoseLevel] = useState<number | null>(null);
  const [glucoseUnit, setGlucoseUnit] = useState<string>("mg/dL");

  const fetchBloodPressureData = useCallback(async () => {
    if (!user?.user_id || !user?.token) return;
    try {
      const res = await fetch(
        `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/bpstatus`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      if (!res.ok) {
        setBpSystolic(null);
        setBpDiastolic(null);
        return;
      }
      const data = await res.json();
      setBpSystolic(data?.data?.lastBloodPressure?.systolic ?? null);
      setBpDiastolic(data?.data?.lastBloodPressure?.diastolic ?? null);
    } catch (error) {
      setBpSystolic(null);
      setBpDiastolic(null);
      console.warn("Error fetching blood pressure data:", error);
    }
  }, [user?.user_id, user?.token]);

  const fetchGlucoseData = useCallback(async () => {
    if (!user?.user_id || !user?.token) return;
    try {
      const res = await fetch(
        `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/glucosestatus`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      if (!res.ok) {
        setGlucoseLevel(null);
        setGlucoseUnit("mg/dL");
        return;
      }
      const data = await res.json();
      setGlucoseLevel(data?.data?.lastGlucose ?? null);
      setGlucoseUnit(data?.data?.glucoseUnit || "mg/dL");
    } catch (error) {
      setGlucoseLevel(null);
      setGlucoseUnit("mg/dL");
      console.warn("Error fetching glucose data:", error);
    }
  }, [user?.user_id, user?.token]);

  const handlePregnancySave = (week: number) => {
    // Update the weeks completed for immediate UI feedback
    setWeeksComplete(week || 0);
    
    // The backend will handle the calculation, so we'll refresh the profile data
    // to get the updated pregnancy information
    if (user?.user_id) {
      // Refresh profile data after a short delay to ensure backend has processed
      setTimeout(() => {
        getProfile();
      }, 500);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      // Initialize all user goals when the app loads
      useMealStore.getState().fetchUserGoals(user.user_id);
      useWaterStore.getState().fetchUserGoals(user.user_id);
      // useStepsStore.getState().fetchUserGoals(user.user_id);
    }
  }, [user?.user_id]);

  // Add this to trigger the modal (you can call this from any button/component)
  const openPregnancyModal = () => {
    setShowPregnancyModal(true);
  };
  // const [steps, setSteps] = useState(null);

  const userId = user?.user_id;

  // Helper function to extract steps from health service data
  const extractStepsFromHealthData = (healthData: any): number | null => {
    if (!healthData) return null;
    
    if (isUsingAppleHealth) {
      // Apple Health format
      return healthData.value || null;
    } else {
      // Fitbit format
      if (healthData["activities-steps"] && healthData["activities-steps"].length > 0) {
        return parseInt(healthData["activities-steps"][0].value) || null;
      }
    }
    
    return null;
  };

  // Add health service data fetching
  useEffect(() => {
    const fetchHealthStepsData = async () => {
      if (!userId || !healthServiceConnected) return;

      try {
        if (watchActive) {
          const day = new Date().toISOString().split('T')[0];
          const watchSteps = parseInt(demoWatchReaders.steps(day, day)["activities-steps"][0]?.value, 10);
          if (watchSteps > 0) useStepsStore.getState().setStepsWalked(watchSteps);
          return;
        }
        let stepsData;
        if (isUsingAppleHealth) {
          stepsData = await appleHealthGetStepsData();
          // Sync with backend
          if (stepsData && user?.user_id) {
            await appleHealthSyncSteps(user.user_id);
          }
        } else {
          // For Fitbit
          const today = new Date().toISOString().split('T')[0];
          stepsData = await fitbitGetStepsData(today);
        }

        // Update steps store with health service data
        if (stepsData) {
          const { setStepsWalked } = useStepsStore.getState();
          // Extract steps count from health service data
          const todaySteps = extractStepsFromHealthData(stepsData);
          if (todaySteps !== null) {
            setStepsWalked(todaySteps);
          }
        }
      } catch (error) {
        console.error('Error fetching health steps data:', error);
      }
    };

    // Initial fetch
    fetchHealthStepsData();

    // Set up periodic refresh
    const interval = setInterval(fetchHealthStepsData, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [userId, healthServiceConnected, isUsingAppleHealth, watchAllowed]);

  const cardData1 = [
    
    {
      id: "0",
      title: t("cards.askDoula.title"),
      description: t("cards.askDoula.description"),
      bg1: "#FBBBE9", // Light pink
      bg2: "#E162BC", // Deep pink
      image1:
        user?.avatar_url && user.avatar_url.trim() !== ""
          ? { uri: user.avatar_url }
          : require("../../../assets/images/doulaImg.png"),
      onPress: () => {
        router.push({
          pathname: "/patient/askdoula",
          params: { from_modal: "true" },
        });
      },
    },
    {
      id: "2",
      title: t("cards.calendar.title"),
      description: t("cards.calendar.description"),
      bg1: "#FFE5B0", // Light yellow
      bg2: "#FFAA00", // Bright orange
      image1: require("../../../assets/images/calendra.png"),
      onPress: () => router.push("/patient/calendar"),
    },
    {
      id: "4",
      title: t("cards.reminders.title"),
      description: t("cards.reminders.description"),
      bg1: Theme.home.remindersBanner[0],
      bg2: Theme.home.remindersBanner[1],
      image1: require("../../../assets/images/reminders/bell.png"),
      onPress: () => router.push("/patient/settings/reminder"),
    },
  ];

  const cardData = cardData1.map((item) => ({
    ...item,
    id: String(item.id), // Ensure id is a number
    onPress: item.onPress || (() => {}),
  }));
  
  useEffect(() => {
    const setAllVisited = async () => {
      if (userId) {
        checkAndAwardExplorerBadge(userId);
      }
    };

    setAllVisited();
  }, [userId]);

  const checkAndAwardExplorerBadge = async (userId: string) => {
    try {
      // Get visited status for all areas
      const healthVisited = await AsyncStorage.getItem("health");
      const journalVisited = await AsyncStorage.getItem("journal");
      const selfCareVisited = await AsyncStorage.getItem("self-care");
      const heartVisited = await AsyncStorage.getItem("heart_2");
      const mealVisited = await AsyncStorage.getItem("meal_1");
      const medicationVisited = await AsyncStorage.getItem("medication_3");
      const weightVisited = await AsyncStorage.getItem("weight_4");
      const waterVisited = await AsyncStorage.getItem("water_5");
      const stepVisited = await AsyncStorage.getItem("step_6");
      const sleepVisited = await AsyncStorage.getItem("sleep_7");

      console.log("Visited areas:", {
        health: healthVisited,
        journal: journalVisited,
        selfCare: selfCareVisited,
        heart: heartVisited,
        meal: mealVisited,
        medication: medicationVisited,
        weight: weightVisited,
        water: waterVisited,
        step: stepVisited,
        sleep: sleepVisited,
      });

      // Check if all required areas have been visited
      // Main sections: health tracking, journal, and self-care
      const mainSectionsVisited =
        healthVisited === "true" &&
        journalVisited === "true" &&
        selfCareVisited === "true";

      // Optional: Check if at least one specific health tracker has been visited
      // You can adjust this requirement based on your needs
      const atLeastOneHealthTrackerVisited =
        heartVisited === "true" &&
        mealVisited === "true" &&
        medicationVisited === "true" &&
        weightVisited === "true" &&
        waterVisited === "true" &&
        stepVisited === "true" &&
        sleepVisited === "true";

      if (mainSectionsVisited && atLeastOneHealthTrackerVisited) {
        // Check if badge has already been awarded to prevent duplicate awards
        const badgeAwarded = await AsyncStorage.getItem("explorerBadgeAwarded");

        if (badgeAwarded !== "true") {
          // Award the badge
          await awardExplorerBadge(userId);

          // Mark badge as awarded
          await AsyncStorage.setItem("explorerBadgeAwarded", "true");
          console.log(
            "Explorer badge awarded and marked as awarded in storage"
          );
        } else {
          console.log("Explorer badge already awarded previously");
        }
      } else {
        console.log("Not all areas have been visited yet");
        if (!mainSectionsVisited) {
          console.log("Missing main sections");
        }
        if (!atLeastOneHealthTrackerVisited) {
          console.log("No health trackers visited");
        }
      }
    } catch (error) {
      console.error("Error checking and awarding Explorer badge:", error);
    }
  };

  // Function to make API call to award the Explorer badge
  const awardExplorerBadge = async (userId: string) => {
    try {
      const badgeType = "EXPLORER";

      // Prepare the data payload for the Explorer badge
      const payload = {
        badgeType: badgeType,
        title: "EXPLORER",
        description:
          "First time having explored all features of the app (should have navigated at least once to all habit trackers, self care, journal)",
      };

      console.log("Making API call to award Explorer badge to user:", userId);

      // Make API call using fetch with error handling
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/${userId}/badges/award`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log("Explorer badge awarded successfully!", data);
      } else {
        console.error("Failed to award Explorer badge:", data.message);
      }

      return data.success;
    } catch (error) {
      console.error("Error awarding Explorer badge:", error);
      return false;
    }
  };

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("user");
        if (userDataString) {
          const parsedUserData = JSON.parse(userDataString);
          console.log("User data:", parsedUserData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    getUserData();
  }, [token]);

  const getProfile = async () => {
    // Then fetch fresh data from API
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/user/${user?.user_id}/profile`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    const data = await response.json();
    
    // console.log("Profile data received:", data);

    // Update user info
    dispatch(
      setUser({
        ...user,
        user_name: data.name,
        user_email: data.email,
        avatar_url: data.avatarUrl,
      })
    );

    // Update pregnancy data - now using the calculated values from backend
    // console.log("Current week from backend:", data.week);
    // console.log("Pregnancy data from backend:", data.pregnancyData);
    
    setWeeksComplete(data.week || 0);
    
    // Set the full pregnancy data for calculations
    setPregnancyData({
      week: data.week || 0,
      day: data.day || 0,
      remainingDays: data.pregnancyData?.remainingDays ?? 280,
      dueDate: data.pregnancyData?.dueDate || new Date().toISOString(),
      totalDays: data.pregnancyData?.totalDays || 0,
      daysSinceAccountCreation: data.pregnancyData?.daysSinceAccountCreation || 0
    });

    // If profile has an image and we don't have one loaded yet, use it
    if (data.profileImage && !image) {
      setImage(data.profileImage);

      // Save to AsyncStorage for persistence
      // await AsyncStorage.setItem("profileImage", data.profileImage);

      // Update Redux state
      dispatch(
        setUser({
          ...user,
          user_photo: data.profileImage,
        })
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      // console.log("Home screen in focus, fetching profile data...")
      if (user?.user_id) {
        getProfile();
        fetchBloodPressureData();
        fetchGlucoseData();
      }

      return () => {
        // console.log("Home screen lost focus")
      };
    }, [user?.user_id, getProfile, fetchBloodPressureData, fetchGlucoseData])
  );

  // Add focus-based refresh for steps data
  useFocusEffect(
    useCallback(() => {
      console.log("Home screen focused - refreshing steps data");
      
      if (user?.user_id) {
        // Refresh steps data when screen comes into focus
        const { fetchStepData } = useStepsStore.getState();
        fetchStepData(user.user_id);
        
        // If health service is connected, also fetch from there
        if (healthServiceConnected) {
          // This will trigger the health service data fetch
          // The useEffect above will handle the actual fetching
        }
      }
    }, [user?.user_id, healthServiceConnected])
  );

  // // Updated useEffect to handle questionnaire navigation based on responses
  // useEffect(() => {
  //   // Get questionResponses from either profile.user.questionResponses or profile.questionResponses
  //   const questionResponses = profile?.questionResponses;

  //   // Check if profile is loaded
  //   if (profile) {
  //     // Check if there are any question responses
  //     if (!questionResponses || questionResponses.length === 0) {
  //       // No responses yet, navigate to AskDoula
  //       console.log("No question responses found, redirecting to AskDoula");
  //       router.push("/patient/askdoula");
  //     } else {
  //       console.log("Found question responses:", questionResponses.length);
  //       // You can add additional logic here if needed
  //     }
  //   }
  // }, [profile, router]);

  // console.log("Auth providers:", user);

  // const onLogout = async () => {
  //   try {
  //     // Sign out from Supabase
  //     const { error: signOutError } = await supabase.auth.signOut();
  //     if (signOutError) {
  //       throw new Error("Error signing out from Supabase");
  //     }

  //     // Check if user signed in with Google
  //     // const providers = userData?.app_metadata?.providers;
  //     console.log("Auth providers:", user?.provider);
  //     if (user?.provider?.[0] === "google") {
  //       try {
  //         console.log("Signing out from Google...");
  //         // Remove Google sign out since it requires being signed in
  //         // await GoogleSignin.revokeAccess();
  //         // await GoogleSignin.signOut();
  //         // console.log("Skipping Google sign out as it requires being signed in");
  //       } catch (googleError) {
  //         console.error("Google Sign-Out error:", googleError);
  //         console.warn(
  //           "Failed to log out from Google, continuing with app logout"
  //         );
  //       }
  //     }

  //     // Dispatch logout action
  //     await AsyncStorage.removeItem("token");
  //     await AsyncStorage.removeItem("user");
  //     await AsyncStorage.removeItem("role");
  //     await AsyncStorage.removeItem("hasOnboarded");
  //     dispatch(removeToken());
  //     // console.log("user", user);
  //     const token = await AsyncStorage.getItem("token");
  //     console.log("Token after removal:", token); // Should show null

  //     // Navigate to login screen
  //     router.replace("/login");
  //   } catch (err: any) {
  //     console.error("Logout error:", err);
  //     Alert.alert("Error", err.message || "An error occurred during logout.");
  //   }
  // };
  // Add this useEffect in your Home component to coordinate date changes across stores

  useEffect(() => {
    if (userId) {
      // Check for new day and reset stores accordingly
      const checkAndResetAllStores = () => {
        console.log("🏠 Home: Checking all stores for new day...");

        // Check and reset meal store
        const mealStore = useMealStore.getState();
        mealStore.checkAndResetForNewDay();

        // Check and reset water store
        const waterStore = useWaterStore.getState();
        waterStore.checkAndResetForNewDay();

        // Initialize all user goals (these should persist)
        // Only fetch if goals are not already set to prevent overriding manual settings
        if (!mealStore.calorieGoal || mealStore.calorieGoal <= 0) {
          console.log("🏠 Home: Setting default calorie goal to 10");
          mealStore.fetchUserGoals(userId);
        }
        
        if (!waterStore.maxGlasses || waterStore.maxGlasses <= 0) {
          console.log("🏠 Home: Setting default water goal to 10");
          waterStore.fetchUserGoals(userId);
        }

        console.log("🏠 Home: All stores checked and reset if needed");
      };

      // Run immediately when component mounts
      checkAndResetAllStores();

      // Set up an interval to check every minute for date changes
      // This handles cases where the app stays open overnight
      const intervalId = setInterval(() => {
        checkAndResetAllStores();
      }, 60000); // Check every minute

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [userId]);


  // ---------- Home version B (prototype) ----------

  const [image, setImage] = React.useState<string | null>(null);
  const [appointments, setAppointments] = useState<{ title: string; date: string }[]>([]);
  const { routines, fetchRoutines } = useSelfCareStore();

  const fetchAppointments = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/appointments`
      );
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  }, [user?.user_id]);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  useEffect(() => {
    if (!routines?.length) fetchRoutines?.();
  }, []);

  const userName = user.user_name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t("homeB.goodMorning") : hour < 18 ? t("homeB.goodAfternoon") : t("homeB.goodEvening");

  const week = weeksComplete;
  const trimesterIndex = week >= 28 ? 3 : week >= 14 ? 2 : 1;
  const weeksToGo = Math.max(0, Math.ceil(remainingDays / 7));
  const progress = Math.min(Math.max(progressPercentage, 0), 100);
  const fruit = fruitForWeek(week);

  // Today's appointments, shown in one line under the check-in
  const today = new Date();
  const todayAppointments = appointments.filter(
    (item) => new Date(item.date).toDateString() === today.toDateString()
  );
  const dayInfo = todayAppointments.length
    ? todayAppointments
        .map(
          (item) =>
            `${new Date(item.date).toLocaleTimeString(i18n.language, {
              hour: "numeric",
              minute: "2-digit",
            })} ${item.title}`
        )
        .join(" · ")
    : t("homeB.nothingBooked");

  // Calendar and Reminders banners close the Home; vitals live in the Health tab, Journal in the dock
  const banners = cardData.filter((item) => item.id === "2" || item.id === "4");
  const routine = routines?.[0];

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Header: photo, greeting, 911 and reminders */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.push("/patient/profile-setting/name")}
              accessibilityRole="button"
              accessibilityLabel={t("homeB.editProfile")}
            >
              <LinearGradient
                colors={[Theme.colors.photoFrom, Theme.colors.photoTo]}
                start={{ x: 0.25, y: 0.07 }}
                end={{ x: 0.75, y: 0.93 }}
                style={styles.photo}
              >
                {image || user?.user_photo ? (
                  <Image source={{ uri: image || user.user_photo }} style={styles.photoImage} />
                ) : (
                  <Svg width="100%" height="100%" viewBox="0 0 56 56">
                    <Circle cx="28" cy="22" r="9.5" fill={Theme.colors.surface} opacity={0.88} />
                    <Path d="M8 56c0-13 8-19 20-19s20 6 20 19z" fill={Theme.colors.surface} opacity={0.88} />
                  </Svg>
                )}
              </LinearGradient>
              <View style={styles.photoBadge}>
                <LineIcon size={9} color={Theme.colors.surface} strokeWidth={2.6}>
                  <Path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19l-4 1z" />
                </LineIcon>
              </View>
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.greeting} numberOfLines={1}>
                {greeting}
              </Text>
              <Text style={styles.name} numberOfLines={1}>
                {userName}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sosPill}
              onPress={() => Linking.openURL("tel:911")}
              accessibilityRole="button"
              accessibilityLabel={t("homeB.emergencyCall")}
            >
              <LineIcon size={14} color={Theme.colors.magenta} strokeWidth={2.2}>
                <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
              </LineIcon>
              <Text style={styles.sosText}>911</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bell}
              onPress={() => router.push("/patient/settings/reminder")}
              accessibilityRole="button"
              accessibilityLabel={t("homeB.reminders")}
            >
              <LineIcon size={18} color={Theme.colors.ink}>
                <Path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
                <Path d="M10 19a2 2 0 0 0 4 0" />
              </LineIcon>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Pregnancy journey hero with the baby inside the progress ring */}
            <LinearGradient
              colors={Theme.home.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroMain}>
                <Text style={styles.heroTag}>{t("homeB.journeyTag")}</Text>
                <Text style={styles.heroWeek}>{t("homeB.week", { week })}</Text>
                <Text style={styles.heroSub}>
                  {t("homeB.weeksToGo", {
                    trimester: t(`profile.trimester${trimesterIndex}`),
                    weeks: weeksToGo,
                  })}
                </Text>
                {week > 0 && (
                  <View style={styles.heroMsg}>
                    <Svg width={13} height={13} viewBox="0 0 24 24">
                      <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill={Theme.colors.magentaVivid} />
                    </Svg>
                    <Text style={styles.heroMsgText}>
                      {t("homeB.babySize", { fruit: t(`fruits.${fruit}`).toLowerCase() })}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/patient/track",
                      params: { weeksComplete: String(week) },
                    })
                  }
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={[Theme.colors.purple, Theme.home.heroButtonEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroButton}
                  >
                    <Text style={styles.heroButtonText}>{t("homeB.viewDetails")}</Text>
                    <LineIcon size={13} color={Theme.colors.surface} strokeWidth={2.4}>
                      <Path d="M5 12h14M13 6l6 6-6 6" />
                    </LineIcon>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <View style={styles.ring}>
                <Image source={babyImageForWeek(week)} style={styles.ringImage} />
                <Svg width={RING} height={RING} viewBox="0 0 104 104" style={StyleSheet.absoluteFill}>
                  <Defs>
                    <SvgGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor={Theme.colors.magentaVivid} />
                      <Stop offset="1" stopColor={Theme.colors.purple} />
                    </SvgGradient>
                  </Defs>
                  <Circle cx="52" cy="52" r="47" stroke={Theme.home.ringTrack} strokeWidth={6} fill="none" />
                  <Circle
                    cx="52"
                    cy="52"
                    r="47"
                    stroke="url(#ring)"
                    strokeWidth={6}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(RING_LENGTH * progress) / 100} ${RING_LENGTH}`}
                    transform="rotate(-90 52 52)"
                  />
                </Svg>
                <Text style={styles.ringPct}>{Math.round(progress)}%</Text>
              </View>
            </LinearGradient>

            {/* Mood check-in (prototype version B, Demo) */}
            <MoodCheckIn />

            {/* Today: what is booked */}
            <Text style={styles.dayInfo} accessibilityLiveRegion="polite">
              <Text style={styles.dayInfoDate}>
                {today.toLocaleDateString(i18n.language, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              {" · "}
              {dayInfo}
            </Text>

            {/* Tracker tiles */}
            <View style={styles.tiles}>
              <StatTile
                title={t("homeB.waterIntake")}
                value={String(glassCount)}
                unit={t("homeB.ofGlasses", { goal: maxGlasses })}
                progress={maxGlasses ? glassCount / maxGlasses : 0}
                colors={Theme.home.tiles.water}
                bar={Theme.home.bars.water}
                art={<WaterArt />}
                onPress={() => router.push("/patient/water")}
              />
              <StatTile
                title={t("homeB.food")}
                value={Math.round(caloriesConsumed || 0).toLocaleString(i18n.language)}
                unit={t("homeB.ofKcal", { goal: (calorieGoal || 0).toLocaleString(i18n.language) })}
                progress={calorieGoal ? (caloriesConsumed || 0) / calorieGoal : 0}
                colors={Theme.home.tiles.food}
                art={<FoodArt />}
                onPress={() => router.push("/patient/meals")}
              />
              <StatTile
                title={t("homeB.steps")}
                value={(stepsWalked || 0).toLocaleString(i18n.language)}
                unit={t("homeB.ofSteps", { goal: (stepGoal || 0).toLocaleString(i18n.language) })}
                progress={stepGoal ? (stepsWalked || 0) / stepGoal : 0}
                colors={Theme.home.tiles.steps}
                bar={Theme.home.bars.steps}
                art={<StepsArt />}
                onPress={() => router.push("/patient/steps")}
              />
              <StatTile
                title={t("homeB.dueDate")}
                value={String(remainingDays)}
                unit={t("homeB.daysLeft")}
                sub={
                  pregnancyData?.dueDate
                    ? new Date(pregnancyData.dueDate).toLocaleDateString(i18n.language, {
                        month: "short",
                        day: "numeric",
                      })
                    : dueDate
                }
                colors={Theme.home.tiles.due}
                art={<DueArt />}
                onPress={() =>
                  router.push({
                    pathname: "/patient/track",
                    params: { weeksComplete: String(week) },
                  })
                }
              />
              {/* Not in version B: kept on the Home at the client's request */}
              <StatTile
                title={t("homeB.bloodPressure")}
                value={bpSystolic !== null && bpDiastolic !== null ? `${bpSystolic}/${bpDiastolic}` : "--/--"}
                unit="mmHg"
                colors={Theme.home.tiles.pressure}
                art={<PressureArt />}
                onPress={() => router.push("/patient/bloodpressure")}
              />
              <StatTile
                title={t("homeB.glucose")}
                value={glucoseLevel !== null ? String(glucoseLevel) : "--"}
                unit={glucoseUnit}
                colors={Theme.home.tiles.glucose}
                art={<GlucoseArt />}
                onPress={() => router.push("/patient/glucose")}
              />
            </View>

            {/* Support */}
            <Text style={styles.sectionLabel}>{t("homeB.support")}</Text>
            <TouchableOpacity
              style={styles.flatRow}
              onPress={() =>
                router.push({ pathname: "/patient/askdoula", params: { from_modal: "true" } })
              }
              accessibilityRole="button"
            >
              <View style={[styles.iconChip, { backgroundColor: Theme.colors.purpleTint }]}>
                <LineIcon size={20} color={Theme.colors.purple}>
                  <Path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5Z" />
                </LineIcon>
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{t("homeB.askConcierge")}</Text>
                <Text style={styles.rowSub}>{t("homeB.askConciergeSub")}</Text>
              </View>
              <LineIcon size={18} color={Theme.colors.ink}>
                <Path d="M9 6l6 6-6 6" />
              </LineIcon>
            </TouchableOpacity>
            {routine && (
              <TouchableOpacity
                style={styles.tipCard}
                onPress={() => router.push("/patient/(tabs)/selfcare")}
                accessibilityRole="button"
              >
                <View style={[styles.iconChip, { backgroundColor: Theme.colors.tealTint }]}>
                  <LineIcon size={20} color={Theme.colors.teal}>
                    <Path d="M9 18h6M10 21h4" />
                    <Path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
                  </LineIcon>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.tipTitle}>{t("homeB.tryRoutine", { title: routine.title })}</Text>
                  <Text style={styles.tipPill}>{t("homeB.selfCareTag")}</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Calendar (kept at the client's request) and Reminders banners */}
            {banners.map((item) => (
              <Card
                key={item.id}
                title={item.title}
                description={item.description}
                bg1={item.bg1}
                bg2={item.bg2}
                image1={item.image1}
                id={item.id}
                onPress={item.onPress}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default Home;

const RING = 104;
const RING_LENGTH = 2 * Math.PI * 47;

// Prototype `.stat` tile: title, chevron chip, value, progress bar and illustration
const StatTile = ({
  title,
  value,
  unit,
  sub,
  progress,
  colors,
  bar = Theme.home.bars.default,
  art,
  action,
  onPress,
}: {
  title: string;
  value: string;
  unit: string;
  sub?: string;
  progress?: number;
  colors: [string, string];
  bar?: [string, string];
  art: React.ReactNode;
  action?: React.ReactNode;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.tileWrap} onPress={onPress} activeOpacity={0.85} accessibilityRole="button">
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
      <Text style={styles.tileTitle}>{title}</Text>
      {action ?? (
        <View style={styles.tileGo}>
          <LineIcon size={12} color={Theme.colors.purple} strokeWidth={2.6}>
            <Path d="M9 6l6 6-6 6" />
          </LineIcon>
        </View>
      )}
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileUnit}>{unit}</Text>
      {progress !== undefined && (
        <View style={styles.tileBar}>
          <LinearGradient
            colors={bar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.tileBarFill, { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }]}
          />
        </View>
      )}
      {sub ? <Text style={styles.tileSub}>{sub}</Text> : null}
      <View style={styles.tileArt} pointerEvents="none">
        {art}
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 6,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  photo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoBadge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Theme.colors.purple,
    borderWidth: 2,
    borderColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontFamily: Theme.typography.subheading,
    fontSize: 12,
    color: Theme.colors.inkSoft,
  },
  name: {
    fontFamily: Theme.typography.display,
    fontSize: 22,
    lineHeight: 26,
    color: Theme.colors.ink,
  },
  sosPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 36,
    paddingHorizontal: 11,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1.5,
    borderColor: Theme.home.sosBorder,
  },
  sosText: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    letterSpacing: 0.2,
    color: Theme.colors.magenta,
  },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    gap: 18,
  },
  hero: {
    borderRadius: Theme.borderRadius.xl,
    paddingVertical: 18,
    paddingLeft: 18,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    ...Theme.shadows.soft,
  },
  heroMain: {
    flex: 1,
    alignItems: "flex-start",
    gap: 4,
  },
  heroTag: {
    fontFamily: Theme.typography.heading,
    fontSize: 10.5,
    color: Theme.colors.purple,
    backgroundColor: Theme.home.heroTagBg,
    borderWidth: 1,
    borderColor: Theme.home.heroTagBorder,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 4,
  },
  heroWeek: {
    fontFamily: Theme.typography.display,
    fontSize: 28,
    lineHeight: 31,
    color: Theme.colors.ink,
  },
  heroSub: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11,
    lineHeight: 15,
    color: Theme.colors.inkSoft,
  },
  heroMsg: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 6,
  },
  heroMsgText: {
    flex: 1,
    fontFamily: Theme.typography.heading,
    fontSize: 11.5,
    lineHeight: 15,
    color: Theme.colors.purple,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Theme.spacing.sm,
    height: 34,
    paddingHorizontal: 13,
    borderRadius: Theme.borderRadius.full,
  },
  heroButtonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.surface,
  },
  ring: {
    width: RING,
    height: RING,
  },
  ringImage: {
    position: "absolute",
    left: 12,
    top: 12,
    width: RING - 24,
    height: RING - 24,
    borderRadius: (RING - 24) / 2,
    backgroundColor: Theme.home.babyBg,
  },
  ringPct: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    fontFamily: Theme.typography.heading,
    fontSize: 11,
    color: Theme.colors.purple,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 2,
    ...Theme.shadows.card,
  },
  dayInfo: {
    backgroundColor: Theme.colors.tealTint,
    borderRadius: 14,
    overflow: "hidden",
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontFamily: Theme.typography.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Theme.home.dayInfoText,
  },
  dayInfoDate: {
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  tileWrap: {
    width: "48.5%",
  },
  tile: {
    minHeight: 112,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.home.tileBorder,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 12,
    gap: 4,
    overflow: "hidden",
    ...Theme.shadows.card,
  },
  tileTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.inkSoft,
  },
  tileGo: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.home.tileChip,
    alignItems: "center",
    justifyContent: "center",
  },
  tileValue: {
    fontFamily: Theme.typography.display,
    fontSize: 22,
    lineHeight: 25,
    color: Theme.colors.ink,
    marginTop: 2,
  },
  tileUnit: {
    fontFamily: Theme.typography.subheading,
    fontSize: 10.5,
    color: Theme.colors.inkFaint,
  },
  tileBar: {
    width: "62%",
    height: 6,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surfaceSunken,
    overflow: "hidden",
    marginTop: 4,
  },
  tileBarFill: {
    height: "100%",
    borderRadius: Theme.borderRadius.full,
  },
  tileSub: {
    fontFamily: Theme.typography.body,
    fontSize: 10.5,
    color: Theme.colors.inkFaint,
    marginTop: 2,
  },
  tileArt: {
    position: "absolute",
    right: 6,
    bottom: Theme.spacing.sm,
  },
  sectionLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.inkFaint,
    marginBottom: -6,
  },
  flatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.md,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontFamily: Theme.typography.body,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    ...Theme.shadows.card,
  },
  tipTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
    marginBottom: 6,
  },
  tipPill: {
    alignSelf: "flex-start",
    fontFamily: Theme.typography.heading,
    fontSize: 10.5,
    color: Theme.colors.teal,
    backgroundColor: Theme.colors.tealTint,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
});
