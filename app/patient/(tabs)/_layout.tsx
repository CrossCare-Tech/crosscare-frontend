import React from "react";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import ConciergeDock from "@/components/ui/ConciergeDock";

// Bottom navigation is the Concierge Dock: Home · Journal · [AI Concierge] · Health · Profile.
// Self care is no longer a tab (D-063): it stays routable and is opened from the Home card.
export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <ConciergeDock {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="home" options={{ title: t("home.title") }} />
      <Tabs.Screen name="journal" options={{ title: t("journals") }} />
      <Tabs.Screen name="health" options={{ title: t("nav.health") }} />
      <Tabs.Screen name="profile" options={{ title: t("profile.title") }} />
      <Tabs.Screen name="selfcare" options={{ href: null }} />
    </Tabs>
  );
}
