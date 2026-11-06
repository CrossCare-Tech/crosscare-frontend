import React from "react";
import { Redirect, Stack } from "expo-router";
import { usePreviewScreens } from "@/utils/demo/demoMode";

// The backend has no routes for these screens yet, so they only open with Simulated data on (or in a preview build)
const WellbeingLayout = () => {
  const preview = usePreviewScreens();
  if (!preview) return <Redirect href="/patient/(tabs)/health" />;
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
};

export default WellbeingLayout;
