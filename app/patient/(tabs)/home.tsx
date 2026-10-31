import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import PregnancyModal from "../modal/preagnancyModal";
import { useMealStore } from "@/zustandStore/mealStore";
import { CONFIG } from "@/constants/config";
import { useFitbit } from "@/zustandStore/useFitbitStore";
import { useAppleHealth } from "@/zustandStore/useAppleHealthStore";
import { todayDateString } from "@/utils/date";


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
    const remainingDays = pregnancyData.remainingDays || 280;
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
  const { t } = useTranslation();
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

  const { maxGlasses, glassCount, setGlassCount } = useWaterStore();
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
  const healthServiceConnected = isUsingAppleHealth ? appleHealthConnected : fitbitConnected;

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
        let stepsData;
        if (isUsingAppleHealth) {
          stepsData = await appleHealthGetStepsData();
          // Sync with backend
          if (stepsData && user?.user_id) {
            await appleHealthSyncSteps(user.user_id);
          }
        } else {
          // For Fitbit
          const today = todayDateString();
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
  }, [userId, healthServiceConnected, isUsingAppleHealth]);

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
      id: "3",
      title: t("cards.motherCare.title"),
      description: t("cards.motherCare.description"),
      bg1: "#ACF3FF", // Light blue
      bg2: "#64C4D4", // Turquoise
      image1: require("../../../assets/images/mother.png"),
      onPress: () => router.push("/patient/health"),
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
      remainingDays: data.pregnancyData?.remainingDays || 280,
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

  const Header = () => {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: Platform.OS === "ios" ? 10 : 10,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: "#F76CCF",
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 30,
            borderWidth: 2,
            borderColor: "#E162BC",
          }}
          onPress={() => {
            Linking.openURL("tel:911");
          }}
        >
          <Text
            style={{
              color: "white",
              fontFamily: "DMSans600",
              fontSize: 16,
            }}
          >
            911
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: 32,
            height: 32,
            borderRadius: 20,
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 2,
          }}
          onPress={() => {
            router.push({
              pathname: "/patient/settings/reminder",
            });
          }}
        >
          <Ionicons name="notifications-outline" size={18} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderCard = ({
    item,
  }: {
    item: {
      title: string;
      description: string;
      bg1: string;
      bg2: string;
      image1: string;
      id: string;
      onPress: () => void;
    };
  }) => (
    <Card
      title={item.title}
      description={item.description}
      bg1={item.bg1} // Ensure bg1 is a valid color string
      bg2={item.bg2} // Ensure bg2 is a valid color string
      image1={item.image1}
      id={item.id}
      onPress={item.onPress}
    />
  );

  const [image, setImage] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  // useEffect(() => {
  //   const loadSavedImage = async () => {
  //     try {
  //       const savedImage = await AsyncStorage.getItem('profileImage');
  //       if (savedImage) {
  //         setImage(savedImage);
  //       }
  //     } catch (error) {
  //       console.error("Error loading saved profile image:", error);
  //     }
  //   };

  //   loadSavedImage();
  // }, []);

  const pickImage = async () => {
    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to change your profile picture."
        );
        return;
      }

      setIsUploading(true);

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        // Set the selected image locally
        setImage(selectedImage.uri);

        // Save to AsyncStorage for persistence between app sessions
        try {
          await AsyncStorage.setItem("profileImage", selectedImage.uri);
        } catch (error) {
          console.error("Error saving profile image to AsyncStorage:", error);
        }

        // Upload to server
        try {
          const formData = new FormData();
          formData.append("imageUrl", {
            uri: selectedImage.uri,
            type: "image/jpeg",
            name: "profile-image.jpg",
          } as any);

          const response = await fetch(
            `${CONFIG.API_BASE_URL}/user/${user?.user_id}/profile/image`,
            {
              method: "POST",
              body: formData,
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
          }

          // Update Redux state with the new image
          dispatch(
            setUser({
              ...user,
              user_photo: selectedImage.uri,
            })
          );

          const title = `Week ${weeksComplete} of Pregnancy`;

          // Add title to the FormData
          const formData1 = new FormData();
          formData1.append("title", title);

          // Add note if provided

          // Append the image to FormData
          formData1.append("imageUrl", {
            uri: selectedImage.uri,
            type: "image/jpeg",
            name: "upload.jpg",
          } as any);

          const response1 = await fetch(
            `${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/journal/upload`,
            {
              method: "POST",
              headers: {
                "Content-Type": "multipart/form-data", // Set correct content type for form data
              },
              body: formData1,
            }
          );

          if (!response1.ok) {
            throw new Error(`Failed to save note: ${response.statusText}`);
          }

          const data = await response.json();
          console.log("Note saved successfully:", data);

          // Optional: Get the response data if your API returns the updated image URL
          // const data = await response.json();
          // if (data && data.imageUrl) {
          //   const serverImageUrl = data.imageUrl;
          //   setImage(serverImageUrl);
          //   await AsyncStorage.setItem('profileImage', serverImageUrl);
          //   dispatch(setUser({...user, user_photo: serverImageUrl}));
          // }
        } catch (uploadError) {
          console.error("Error uploading image to server:", uploadError);
          // Don't show an alert here since the image is already saved locally
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const userName = user.user_name.split(" ")[0];

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "white",
      }}
    >
      <StatusBar backgroundColor="#FAB5E8" barStyle="dark-content" />

      <ScrollView
        style={{
          flex: 1,
          // paddingTop: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundCurve} />

        <Header />

        <View
          style={{
            alignItems: "center",
            marginTop: -35,
          }}
        >
          <TouchableOpacity activeOpacity={0.9} onPress={pickImage}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 4,
                borderColor: "white",
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                overflow: "hidden",
              }}
            >
              {image ? (
                <Image
                  source={{ uri: image }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 50,
                  }}
                  resizeMode="contain"
                />
              ) : (
                <User width="100%" height="100%" color="#888" />
              )}
            </View>
            {isUploading && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderRadius: 50,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#F76CCF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={{
            alignItems: "center",
            marginTop: 10,
            paddingBottom: 10,
          }}
        >
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.weekText}>
            {" "}
            {t("home.week")} {weeksComplete}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginTop: 15,
            justifyContent: "space-between",
            paddingHorizontal: 20,
          }}
        >
          {/* Water Intake Card */}
          <TouchableOpacity
            style={styles.statCard1}
            onPress={() => router.push("/patient/water")}
          >
            <View style={styles.statHeader}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#67B6FF3D",
                  borderRadius: 12,
                  marginRight: 6,
                }}
              >
                <WaterIcon width={14} height={14} />
              </View>
              <Text
                style={styles.statTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("home.waterIntake")}
              </Text>
            </View>

            <View style={styles.waterProgressBar}>
              <View
                style={[
                  styles.waterProgress,
                  {
                    width:
                      maxGlasses > 0
                        ? `${(glassCount / maxGlasses) * 100}%` // Only calculate width if maxGlasses > 0
                        : "0%", // Set width to 0% if maxGlasses is 0
                  },
                ]}
              />
            </View>

            <View style={styles.statValueContainer}>
              <Text style={styles.statSuffix}>
                {" "}
                <Text style={styles.statValue}>{glassCount}</Text> /{" "}
                {maxGlasses} {t("home.glasses")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Food Card */}
          <TouchableOpacity
            style={styles.statCard2}
            onPress={() => router.push("/patient/meals")}
          >
            <View style={styles.statHeader}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#38C47229",
                  borderRadius: 12,
                  marginRight: 6,
                }}
              >
                <FoodIcon width={14} height={14} />
              </View>
              <Text style={styles.statTitle}>{t("home.food")}</Text>
            </View>

            <View style={styles.foodQualityContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(caloriesConsumed / calorieGoal) * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.caloriesContainer}>
                <Text style={styles.calorieText}>{caloriesConsumed}</Text>
                <Text style={styles.calorieSubText}>
                  {" "}
                  / {calorieGoal} Calories
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 2,
              }}
            >
              <View style={styles.goodFoodBadge}>
                <Text style={styles.goodFoodText}>
                  Good Food: {goodFoodCount}
                </Text>
              </View>
              <View style={styles.badFoodBadge}>
                <Text style={styles.badFoodText}>Bad Food: {badFoodCount}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Steps Card */}
          <TouchableOpacity
            style={styles.statCard3}
            onPress={() => router.push("/patient/steps")}
          >
            <View style={styles.statHeader}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#5E4FA233",
                  borderRadius: 12,
                  marginRight: 6,
                }}
              >
                <StepsIcon width={14} height={14} />
              </View>
              <Text style={styles.statTitle}>{t("home.steps")}</Text>
            </View>

            <Text style={styles.stepsValue}>{stepsWalked}</Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "DMSans400",
                marginTop: 5,
              }}
            >
              <Text style={styles.stepsGoal}>{t("home.goal")}:</Text> {stepGoal}
            </Text>
          </TouchableOpacity>

          {/* Due Date Card */}
          <TouchableOpacity
            style={styles.statCard4}
            onPress={() =>
              router.push({
                pathname: "/patient/track",
                params: { weeksComplete: weeksComplete.toString() },
              })
            }
          >
            <View style={styles.statHeader}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#A855F71A",
                  borderRadius: 12,
                  marginRight: 6,
                }}
              >
                <Calendar width={14} height={14} />
              </View>
              <Text style={styles.statTitle} numberOfLines={1}>
                {t("home.due_date")}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "DMSans500",
                color: "#434343",
              }}
            >
              <Text
                onPress={openPregnancyModal}
                style={{
                  fontSize: 16,
                  fontFamily: "DMSans600",
                  color: "#A855F7",
                }}
              >
                {remainingDays}
              </Text>{" "}
              {t("daysLeft")}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "DMSans500",
                color: "#434343",
              }}
            >
              {dueDate}
            </Text>
          </TouchableOpacity>

          {/* Blood Pressure Card */}
          <TouchableOpacity
            style={styles.statCard5}
            onPress={() => router.push("/patient/bloodpressure")}
          >
            <View style={styles.statHeader}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#E573731A",
                  borderRadius: 12,
                  marginRight: 6,
                }}
              >
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={14}
                  color="#E57373"
                />
              </View>
              <Text style={styles.statTitle}>Blood Pressure</Text>
            </View>

            <Text style={styles.bpValue}>
              {bpSystolic !== null && bpDiastolic !== null
                ? `${bpSystolic}/${bpDiastolic}`
                : "--/--"}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "DMSans400",
                marginTop: 5,
                color: "#434343",
              }}
            >
              mmHg
            </Text>
          </TouchableOpacity>

          {/* Glucose Card */}
          <TouchableOpacity
            style={styles.statCard6}
            onPress={() => router.push("/patient/glucose")}
          >
            <View style={styles.statHeader}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#8E44AD1A",
                  borderRadius: 12,
                  marginRight: 6,
                }}
              >
                <MaterialCommunityIcons
                  name="chart-line"
                  size={14}
                  color="#8E44AD"
                />
              </View>
              <Text style={styles.statTitle}>Glucose</Text>
            </View>

            <Text style={styles.glucoseValue}>
              {glucoseLevel !== null ? glucoseLevel : "--"}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "DMSans400",
                marginTop: 5,
                color: "#434343",
              }}
            >
              {glucoseUnit}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={cardData}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.cardContainer}
          showsVerticalScrollIndicator={false}
        />
        
        {/* Copyright Notice */}
<View style={styles.copyrightContainer}>
  <Text style={styles.copyrightText}>© 2024 Cross Care Tech</Text>
</View>
      </ScrollView>

      <PregnancyModal
        visible={showPregnancyModal}
        onClose={() => setShowPregnancyModal(false)}
        onSave={handlePregnancySave}
      />
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  copyrightContainer: {
  alignItems: "center",
  paddingVertical: 20,
  paddingHorizontal: 20,
  
},
copyrightText: {
  fontSize: 12,
  color: "#888",
  fontFamily: "DMSans400",
  textAlign: "center",
},
  cardContainer: {
    // padding: 20,
    marginTop: 10,
    marginHorizontal: 20,
    marginVertical: Platform.OS === "ios" ? 10 : 0,
    paddingBottom: Platform.OS === "android" ? 10 : 40,
  },
  statCard1: {
    width: "48%",
    height: 103, // Fixed height for all cards
    backgroundColor: "rgba(35, 149, 255, 0.05)",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  statCard2: {
    width: "48%",
    height: 103, // Fixed height for all cards
    backgroundColor: "rgba(21, 135, 68, 0.05)",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  statCard3: {
    width: "48%",
    height: 103, // Fixed height for all cards
    backgroundColor: "rgba(168, 85, 247, 0.05)",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  statCard4: {
    width: "48%",
    height: 103, // Fixed height for all cards
    backgroundColor: "rgba(168, 85, 247, 0.05)",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  statCard5: {
    width: "48%",
    height: 103,
    backgroundColor: "rgba(229, 115, 115, 0.05)",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  bpValue: {
    fontSize: 22,
    fontFamily: "DMSans600",
    color: "#E57373",
  },
  statCard6: {
    width: "48%",
    height: 103,
    backgroundColor: "rgba(142, 68, 173, 0.05)",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  glucoseValue: {
    fontSize: 22,
    fontFamily: "DMSans600",
    color: "#8E44AD",
  },
  userName: {
    fontSize: 20,
    fontFamily: "DMSans600",
    color: "#87247D",
  },
  weekText: {
    fontSize: 14,
    color: "#F76CCF",
    marginTop: 2,
    fontFamily: "DMSans600",
  },
  backgroundCurve: {
    backgroundColor: "#FAB5E8",
    height: 2000,
    position: "absolute",
    top: -1 * (2000 - 70),
    width: 2000,
    borderRadius: 2000,
    alignSelf: "center",
    zIndex: -1,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 20,
    marginBottom: 5,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: "DMSans600",
    color: "#373737",
  },
  statValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    // marginTop: 5,
  },
  statValue: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#2395FF",
  },
  statSuffix: {
    fontSize: 12,
    color: "#373737",
    fontFamily: "DMSans500",
  },
  waterProgressBar: {
    height: 8,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#E1EEFF",
    borderRadius: 4,
    marginVertical: 10,
  },
  waterProgress: {
    height: 8,
    backgroundColor: "#4A9CFF",
    borderRadius: 4,
  },
  foodQualityContainer: {
    flexDirection: "column",
    // marginVertical: 2,
    gap: 5,
  },
  progressBar: {
    height: 5,
    width: "100%",
    backgroundColor: "#E5F5EC",
    borderRadius: 10,
    overflow: "hidden",
    // marginBottom: 12,
  },
  calorieText: {
    fontSize: 14,
    fontFamily: "DMSans600",
    color: "rgba(70, 208, 45, 1)",
  },
  calorieSubText: {
    fontSize: 10,
    fontFamily: "DMSans500",
    color: "rgba(55, 55, 55, 1)",
  },
  goodFoodBadge: {
    backgroundColor: "rgba(112, 217, 92, 1)",
    borderWidth: 0.5,
    borderColor: "rgba(64, 206, 35, 1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  goodFoodText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontFamily: "DMSans600",
  },
  badFoodBadge: {
    borderWidth: 0.5,
    borderColor: "rgba(252, 49, 48, 1)",
    backgroundColor: "rgba(249, 98, 97, 1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  badFoodText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontFamily: "DMSans600",
  },
  caloriesContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    // marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "rgba(70, 208, 45, 1)",
  },
  qualityIndicator: {
    height: 12,
    marginHorizontal: 1,
    borderRadius: 10,
  },
  qualityScoreLabel: {
    fontSize: 12,
    marginTop: 6,
    // maxWidth:' 100%',
    color: "#373737",
    fontFamily: "DMSans500",
  },
  qualityScoreValue: {
    fontSize: 18,
    color: "#22C800",
    fontFamily: "DMSans600",
    // marginLeft: 5,
  },
  qualityScoreSuffix: {
    fontSize: 14,
    color: "#666",
    marginLeft: 2,
  },
  stepsValue: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#5E4FA2",
    marginTop: 5,
  },
  stepsGoal: {
    fontSize: 12,
    color: "#373737",
    fontFamily: "DMSans600",
  },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 10,
  },
  daysLeftValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#9966CC",
  },
  daysLeftLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  dueDateText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
});
