import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { DOCUMENTS } from "@/constants/documents";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { styles as rowStyles } from "@/components/devices/DeviceSourceRows";
import { metricStyles } from "@/components/vitals/MetricUI";

const PAGE_SIZE = 4;

// Prototype 10.6 "PDF Paginated List": the stored documents, four to a page. Each one opens the 10.5 viewer.
export default function DocumentsScreen() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const pages = Math.ceil(DOCUMENTS.length / PAGE_SIZE);
  const items = DOCUMENTS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const date = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(i18n.language, { month: "short", day: "numeric", year: "numeric" });

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("documents.title")} action={{ label: t("intake.title"), onPress: () => router.push("/patient/intake-form") }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={metricStyles.content}>
          {items.map((document) => (
            <TouchableOpacity
              key={document.name}
              style={[styles.card, rowStyles.row]}
              onPress={() => router.push({ pathname: "/patient/document-viewer", params: { name: document.name } })}
              accessibilityRole="button"
            >
              <View style={rowStyles.iconChip}>
                <Feather name="file" size={18} color={Theme.colors.purple} />
              </View>
              <View style={rowStyles.rowText}>
                <Text style={rowStyles.rowTitle} numberOfLines={1}>
                  {document.name}
                </Text>
                <Text style={rowStyles.rowSub}>{`${date(document.date)} · ${document.size}`}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Theme.colors.inkFaint} />
            </TouchableOpacity>
          ))}

          <View style={styles.pager}>
            <TouchableOpacity
              style={[styles.pageButton, page === 1 && styles.pageDisabled]}
              onPress={() => setPage(page - 1)}
              disabled={page === 1}
              accessibilityRole="button"
              accessibilityLabel={t("documents.previousPage")}
            >
              <Feather name="chevron-left" size={16} color={Theme.colors.ink} />
            </TouchableOpacity>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.pageButton, n === page && styles.pageActive]}
                onPress={() => setPage(n)}
                accessibilityRole="button"
                accessibilityState={{ selected: n === page }}
              >
                <Text style={[styles.pageText, n === page && styles.pageTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.pageButton, page === pages && styles.pageDisabled]}
              onPress={() => setPage(page + 1)}
              disabled={page === pages}
              accessibilityRole="button"
              accessibilityLabel={t("documents.nextPage")}
            >
              <Feather name="chevron-right" size={16} color={Theme.colors.ink} />
            </TouchableOpacity>
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
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  pager: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: Theme.spacing.xs,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  pageActive: {
    backgroundColor: Theme.colors.magenta,
    borderColor: Theme.colors.magenta,
  },
  pageDisabled: {
    opacity: 0.4,
  },
  pageText: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
  },
  pageTextActive: {
    color: Theme.colors.surface,
  },
});
