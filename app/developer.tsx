import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { CONFIG } from "@/constants/config";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import InlineNotice from "@/components/ui/InlineNotice";
import Toggle from "@/components/profile/Toggle";
import { removeUser } from "@/store/userSlice";
import { useDemoMode } from "@/utils/demo/demoMode";
import { resetDemoDb } from "@/utils/demo/mockDb";
import { loadSampleConversation } from "@/utils/demo/mockConversations";
import { DemoLogEntry, getDemoLog } from "@/utils/demo/installDemoInterceptor";

// Settings > Developer. Reachable from Profile and, before signing in, by long-pressing the logo on Login.
const Developer = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const token = useSelector((state: any) => state.user.token);
  const enabled = useDemoMode((state) => state.enabled);
  const setEnabled = useDemoMode((state) => state.setEnabled);
  const [requests, setRequests] = useState<DemoLogEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      setRequests(getDemoLog());
    }, [])
  );

  // A session from one data source is not valid in the other, so switching signs her out
  const switchSource = async (value: boolean) => {
    await setEnabled(value);
    await AsyncStorage.clear();
    dispatch(removeUser());
    router.replace("/login");
  };

  const toggleDemo = (value: boolean) => {
    if (!token) {
      setEnabled(value);
      return;
    }
    Alert.alert(t("developer.switchTitle"), t("developer.switchMessage"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("developer.switchConfirm"), onPress: () => switchSource(value) },
    ]);
  };

  const resetData = () => {
    Alert.alert(t("developer.resetTitle"), t("developer.resetMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("developer.resetConfirm"),
        style: "destructive",
        onPress: async () => {
          await resetDemoDb();
          Alert.alert(t("developer.resetDone"));
        },
      },
    ]);
  };

  // Puts a short earlier conversation in the Concierge chat, to show it without typing first
  const loadSampleChat = async () => {
    await loadSampleConversation(i18n.language);
    Alert.alert(t("developer.sampleChatDone"));
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <AuthTopBar title={t("developer.title")} />
          <View style={styles.content}>
            <InlineNotice notice={{ message: t("developer.notice"), variant: "info" }} />

            <Text style={styles.sectionTitle}>{t("developer.dataSection")}</Text>
            <View style={styles.card}>
              <View style={[styles.row, styles.rowLast]}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{t("developer.simulatedData")}</Text>
                  <Text style={styles.rowSub}>{t("developer.simulatedDataHint")}</Text>
                </View>
                <Toggle
                  value={enabled}
                  onChange={toggleDemo}
                  accessibilityLabel={t("developer.simulatedData")}
                />
              </View>
            </View>

            <View style={styles.card}>
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.rowSub}>{t("developer.source")}</Text>
                <Text style={styles.value} numberOfLines={1}>
                  {enabled ? t("developer.sourceDevice") : CONFIG.API_BASE_URL || t("developer.notSet")}
                </Text>
              </View>
            </View>

            {enabled && (
              <TouchableOpacity style={styles.button} onPress={resetData} accessibilityRole="button">
                <Text style={styles.buttonText}>{t("developer.reset")}</Text>
              </TouchableOpacity>
            )}

            {enabled && (
              <TouchableOpacity style={styles.button} onPress={loadSampleChat} accessibilityRole="button">
                <Text style={styles.buttonText}>{t("developer.sampleChat")}</Text>
              </TouchableOpacity>
            )}

            {enabled && (
              <>
                <Text style={styles.sectionTitle}>{t("developer.requests")}</Text>
                <View style={styles.card}>
                  {requests.length === 0 ? (
                    <Text style={[styles.rowSub, styles.empty]}>{t("developer.noRequests")}</Text>
                  ) : (
                    requests.map((entry, index) => (
                      <View
                        key={`${entry.at}-${index}`}
                        style={[styles.logRow, index === requests.length - 1 && styles.rowLast]}
                      >
                        <Text style={styles.method}>{entry.method}</Text>
                        <Text style={styles.path} numberOfLines={1}>
                          {entry.path}
                        </Text>
                        {!entry.matched && (
                          <Text style={styles.unmatched}>{t("developer.unmatched")}</Text>
                        )}
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default Developer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 18,
  },
  sectionTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
    marginTop: 2,
    marginBottom: -6,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
  },
  rowSub: {
    fontFamily: Theme.typography.body,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  value: {
    flexShrink: 1,
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.ink,
  },
  button: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.magenta,
  },
  empty: {
    paddingVertical: 12,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  method: {
    width: 52,
    fontFamily: Theme.typography.heading,
    fontSize: 10.5,
    color: Theme.colors.purple,
  },
  path: {
    flex: 1,
    fontFamily: Theme.typography.body,
    fontSize: 11,
    color: Theme.colors.ink,
  },
  unmatched: {
    fontFamily: Theme.typography.heading,
    fontSize: 10.5,
    color: Theme.colors.warning,
  },
});
