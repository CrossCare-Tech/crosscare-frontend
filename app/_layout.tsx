import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { useFonts } from "expo-font";
import { Stack, Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import "react-native-reanimated";
import { Provider, useDispatch, useSelector } from "react-redux";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "@/constants/api";
import { useColorScheme } from "@/hooks/useColorScheme";
import { store } from "../store/store";
import { setToken, setUser } from "../store/userSlice";
import { FloatingProvider } from "@/context/FloatingContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

const RootLayoutNav = () => {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();

  const token = useSelector((state: any) => state.user.token);

  const [checkingAuth, setCheckingAuth] = useState(true);

  const [loaded] = useFonts({
    DMSans300: require("../assets/fonts/DMSans-Light.ttf"),
    DMSans400: require("../assets/fonts/DMSans-Regular.ttf"),
    DMSans500: require("../assets/fonts/DMSans-Medium.ttf"),
    DMSans600: require("../assets/fonts/DMSans-SemiBold.ttf"),
    DMSans700: require("../assets/fonts/DMSans-Bold.ttf"),
    Inter300: require("../assets/fonts/Inter_18pt-Light.ttf"),
    Inter400: require("../assets/fonts/Inter_18pt-Regular.ttf"),
    Inter500: require("../assets/fonts/Inter_18pt-Medium.ttf"),
    Inter600: require("../assets/fonts/Inter_18pt-SemiBold.ttf"),
    Inter700: require("../assets/fonts/Inter_18pt-Bold.ttf"),
    Inter800: require("../assets/fonts/Inter_18pt-ExtraBold.ttf"),
    OpenSans300: require("../assets/fonts/OpenSans-Light.ttf"),
    OpenSans400: require("../assets/fonts/OpenSans-Regular.ttf"),
    OpenSans500: require("../assets/fonts/OpenSans-Medium.ttf"),
    OpenSans600: require("../assets/fonts/OpenSans-SemiBold.ttf"),
    OpenSans700: require("../assets/fonts/OpenSans-Bold.ttf"),
  });

  // -----------------------------
  // CHECK STORED AUTH TOKEN
  // -----------------------------
  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("userToken");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken) {
          dispatch(setToken(storedToken));
        }

        if (storedUser) {
          dispatch(setUser(JSON.parse(storedUser)));
        }
      } catch (error) {
        console.log("Error loading auth:", error);
      }

      setCheckingAuth(false);
    };

    checkToken();
  }, []);


  // -----------------------------
  // SESSION TRACKING (persistent + retry queue)
  // -----------------------------
  useEffect(() => {
    // lazy import helpers to avoid circular issues
    const { attachAppStateHandlers, getSessionStart, setSessionStart, flushPending } =
      require('./utils/sessionMetrics');

    const getToken = async () => token || null;
    const getStart = async () => await getSessionStart();
    const clearStart = async () => await require('@react-native-async-storage/async-storage').removeItem('session_start');
    const setStart = async (iso: string) => await setSessionStart(iso);

    // attach global AppState handlers
    attachAppStateHandlers(getToken, getStart, clearStart, setStart as any);

    // initial setup on mount or when token changes
    (async () => {
      const currentToken = await getToken();
      if (currentToken) {
        const existing = await getStart();
        if (!existing) await setStart(new Date().toISOString());
        await flushPending(currentToken);
      }
    })();
  }, [token]);

  // detect explicit logout to end session immediately
  const prevTokenRef = useRef<string | null>(null);
  useEffect(() => {
    const run = async () => {
  const { getSessionStart, endSession, clearSessionStart } = require('./utils/sessionMetrics');
      const prev = prevTokenRef.current;
      // logged out: previous token existed but token is now falsy
      if (prev && !token) {
        try {
          const start = await getSessionStart();
          await endSession(prev, start || null, new Date().toISOString());
          await clearSessionStart();
        } catch (err) {
          console.warn('Logout session flush failed', err);
        }
      }
      prevTokenRef.current = token || null;
    };
    run();
  }, [token]);

  // -----------------------------
  // HIDE SPLASH
  // -----------------------------
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;
  if (checkingAuth) return null;

  return (
    <>
      <StatusBar style="dark" backgroundColor="white" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "ios_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forget-password" />
        <Stack.Screen name="avatar" />
        <Stack.Screen name="/patient/(tabs)/home" />
      </Stack>
    </>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <FloatingProvider>
          <RootLayoutNav />
        </FloatingProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}