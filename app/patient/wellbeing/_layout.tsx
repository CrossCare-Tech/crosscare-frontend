import React from "react";
import { Redirect, Stack } from "expo-router";
import { useDemoMode } from "@/utils/demo/demoMode";

// The backend has no routes for these screens yet, so they only open with Simulated data on
const WellbeingLayout = () => {
  const demoMode = useDemoMode((state) => state.enabled);
  if (!demoMode) return <Redirect href="/patient/(tabs)/health" />;
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
};

export default WellbeingLayout;
