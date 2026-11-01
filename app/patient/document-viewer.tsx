import React from "react";
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { DOCUMENTS } from "@/constants/documents";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { metricStyles } from "@/components/vitals/MetricUI";

// Prototype 10.5 "PDF Document Viewer": the page, its number, and search / share / download.
// ponytail: the page is a placeholder sheet like the prototype's, there is no PDF rendering yet. That needs a native
// PDF library (a new Android build) and a backend that serves the files. Search and download wait for it too;
// share sends only the file name until there is a real file to hand over.
export default function DocumentViewerScreen() {
  const { t } = useTranslation();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const document = DOCUMENTS.find((item) => item.name === name) ?? DOCUMENTS[0];

  const soon = () => Alert.alert(document.name, t("documents.soon"));

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={document.name} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[metricStyles.content, styles.content]}>
          <View style={styles.paper}>
            <View style={[styles.line, { width: "40%" }]} />
            <View style={styles.line} />
            <View style={styles.line} />
            <View style={[styles.line, { width: "62%" }]} />
            <View style={[styles.line, styles.footerLine]} />
          </View>

          <View style={styles.bar}>
            <Text style={styles.page}>{t("documents.pageOf", { page: 1, total: document.pages })}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={soon} accessibilityRole="button" accessibilityLabel={t("documents.search")} hitSlop={8}>
                <Feather name="search" size={17} color={Theme.colors.inkSoft} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Share.share({ message: document.name })}
                accessibilityRole="button"
                accessibilityLabel={t("documents.share")}
                hitSlop={8}
              >
                <Feather name="share-2" size={17} color={Theme.colors.inkSoft} />
              </TouchableOpacity>
              <TouchableOpacity onPress={soon} accessibilityRole="button" accessibilityLabel={t("documents.download")} hitSlop={8}>
                <Feather name="download" size={17} color={Theme.colors.inkSoft} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 34,
  },
  paper: {
    aspectRatio: 0.78,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: 12,
    padding: 18,
    gap: 9,
    ...Theme.shadows.card,
  },
  line: {
    height: 7,
    borderRadius: 4,
    backgroundColor: Theme.colors.surfaceSunken,
  },
  footerLine: {
    position: "absolute",
    left: 18,
    bottom: 18,
    width: "28%",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  page: {
    fontFamily: Theme.typography.heading,
    fontSize: 12.5,
    color: Theme.colors.inkFaint,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
});
