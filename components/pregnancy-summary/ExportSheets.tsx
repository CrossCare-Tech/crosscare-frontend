import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import AuthTopBar from "@/components/ui/AuthTopBar";
import { useAuthDialog } from "@/components/ui/AuthDialog";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { Pill } from "@/components/vitals/VitalsUI";
import { demoPdfName, demoQrCells, QR_SIZE } from "./model";
import { SummarySections } from "./Sections";

// What opens from the summary: the health details, 6.2 and 6.3 as screens, and the locked state as a sheet. The export ones are a demo: no file, link or message is created.

const PREPARING_MS = 2000;
const CODE_HOURS = 24;

const SheetFrame = ({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) => {
  const { t } = useTranslation();
  return (
    <Modal visible transparent statusBarTranslucent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pill label={t("pregnancySummary.demo")} tone="teal" />
            <View style={styles.flex} />
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t("summaryExport.close")}
            >
              <Feather name="x" size={20} color={Theme.colors.inkFaint} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          <View style={styles.footer}>{footer}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// A screen opened from the summary, with the prototype's top bar and back arrow
const SummaryScreen = ({
  title,
  children,
  footer,
  demo = true,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  demo?: boolean; // the health details hold real records, so they carry only their sections' own tags
}) => {
  const { t } = useTranslation();
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.flex}>
        <AuthTopBar title={title} />
        <ScrollView style={styles.flex} contentContainerStyle={styles.windowContent} showsVerticalScrollIndicator={false}>
          {demo && (
            <View style={styles.windowTag}>
              <Pill label={t("pregnancySummary.demo")} tone="teal" />
            </View>
          )}
          {children}
        </ScrollView>
        {footer && <View style={styles.windowFooter}>{footer}</View>}
      </SafeAreaView>
    </ScreenBackground>
  );
};

const SheetButton = ({
  label,
  icon,
  onPress,
  ghost,
  disabled,
}: {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  ghost?: boolean;
  disabled?: boolean;
}) => {
  const color = ghost ? Theme.colors.purple : Theme.colors.surface;
  return (
    <TouchableOpacity
      style={[styles.button, ghost && styles.ghost, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      {icon && <Feather name={icon} size={16} color={color} />}
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export const DetailsScreen = () => {
  const { t } = useTranslation();
  return (
    <SummaryScreen title={t("pregnancySummary.detailsTitle")} demo={false}>
      <SummarySections />
    </SummaryScreen>
  );
};

// The preview holds the health sections, which is what the document would contain
export const PdfScreen = () => {
  const { t } = useTranslation();
  const { dialog, show } = useAuthDialog();
  const [progress, setProgress] = useState(0);
  const ready = progress >= 100;

  useEffect(() => {
    const step = setInterval(() => setProgress((value) => Math.min(value + 5, 100)), PREPARING_MS / 20);
    return () => clearInterval(step);
  }, []);

  const simulated = (message: string) => show({ variant: "info", title: t("pregnancySummary.demo"), message: t(message) });

  return (
    <SummaryScreen
      title={t("summaryExport.pdfTitle")}
      footer={
        <>
          <SheetButton label={t("summaryExport.download")} icon="download" disabled={!ready} onPress={() => simulated("summaryExport.downloaded")} />
          <SheetButton label={t("summaryExport.shareClinic")} icon="share-2" ghost disabled={!ready} onPress={() => simulated("summaryExport.clinicShared")} />
          <TouchableOpacity style={styles.switchLink} onPress={() => router.replace("/patient/pregnancy-summary/qr")} accessibilityRole="button">
            <Text style={styles.switchText}>{t("summaryExport.useQr")}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <View style={styles.previewCard}>
        <View style={styles.docPage} accessibilityRole="image" accessibilityLabel={t("summaryExport.documentPreview")}>
          {[60, 100, 100, 80].map((width, index) => (
            <View key={index} style={[styles.docLine, { width: `${width}%` }]} />
          ))}
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {demoPdfName()}
        </Text>
        {ready && <Text style={styles.caption}>{t("summaryExport.generated")}</Text>}
      </View>
      <View
        style={styles.progress}
        accessibilityRole="progressbar"
        accessibilityLabel={t("summaryExport.preparing")}
        accessibilityValue={{ min: 0, max: 100, now: progress }}
      >
        <LinearGradient
          colors={[Theme.colors.magentaVivid, Theme.colors.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${progress}%` }]}
        />
      </View>
      <Text style={styles.progressText} accessibilityLiveRegion="polite">
        {t(ready ? "summaryExport.ready" : "summaryExport.preparing")}
      </Text>
      <Text style={styles.caption}>{t("summaryExport.simulated")}</Text>
      <SummarySections />
      {dialog}
    </SummaryScreen>
  );
};

export const QrScreen = () => {
  const { t, i18n } = useTranslation();
  const { dialog, show } = useAuthDialog();
  const [code, setCode] = useState(() => ({ id: 1, expiresAt: Date.now() + CODE_HOURS * 3600 * 1000 }));
  const cell = 100 / QR_SIZE;

  return (
    <SummaryScreen
      title={t("summaryExport.qrTitle")}
      footer={
        <>
          <SheetButton
            label={t("summaryExport.shareCode")}
            icon="share-2"
            onPress={() => show({ variant: "info", title: t("pregnancySummary.demo"), message: t("summaryExport.codeShared") })}
          />
          <SheetButton
            label={t("summaryExport.regenerate")}
            ghost
            onPress={() => setCode(({ id }) => ({ id: id + 1, expiresAt: Date.now() + CODE_HOURS * 3600 * 1000 }))}
          />
          <TouchableOpacity style={styles.switchLink} onPress={() => router.replace("/patient/pregnancy-summary/pdf")} accessibilityRole="button">
            <Text style={styles.switchText}>{t("summaryExport.usePdf")}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <View style={styles.previewCard}>
        <View style={styles.qr} accessibilityRole="image" accessibilityLabel={t("summaryExport.qrSample")}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            {demoQrCells(code.id).map(([x, y]) => (
              <Rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill={Theme.colors.purple} />
            ))}
          </Svg>
        </View>
        <Text style={styles.cardTitle}>{t("summaryExport.scanToView")}</Text>
        <Text style={styles.caption}>{t("summaryExport.expires24")}</Text>
        <Text style={styles.caption} accessibilityLiveRegion="polite">
          {t("summaryExport.codeInfo", {
            id: code.id,
            when: new Date(code.expiresAt).toLocaleString(i18n.language, { dateStyle: "medium", timeStyle: "short" }),
          })}
        </Text>
      </View>
      <Text style={styles.caption}>{t("summaryExport.qrSample")}</Text>
      {dialog}
    </SummaryScreen>
  );
};

export const LockedSheet = ({ onClose, onManagePlan }: { onClose: () => void; onManagePlan: () => void }) => {
  const { t } = useTranslation();
  return (
    <SheetFrame
      title={t("summaryExport.accessTitle")}
      onClose={onClose}
      footer={<SheetButton label={t("summaryExport.managePlan")} onPress={onManagePlan} />}
    >
      <LinearGradient
        colors={[Theme.colors.magentaTint, Theme.colors.purpleTint]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.lockedHero}
      >
        <View style={styles.lockedIcon}>
          <Feather name="lock" size={22} color={Theme.colors.magenta} />
        </View>
        <Text style={styles.lockedTitle}>{t("summaryExport.unlock")}</Text>
        <Text style={styles.lockedCaption}>{t("summaryExport.plusPlan")}</Text>
      </LinearGradient>
      {["pdfFeature", "qrFeature", "clinicFeature"].map((feature) => (
        <View key={feature} style={styles.feature}>
          <Feather name="check" size={18} color={Theme.colors.success} />
          <Text style={styles.featureText}>{t(`summaryExport.${feature}`)}</Text>
        </View>
      ))}
    </SheetFrame>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  windowContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: Theme.spacing.xxl,
    gap: 18,
  },
  windowFooter: {
    gap: Theme.spacing.sm,
    paddingHorizontal: 22,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.md,
  },
  windowTag: {
    alignSelf: "flex-start",
  },
  overlay: {
    flex: 1,
    backgroundColor: Theme.colors.scrim,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: Theme.colors.bg,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Theme.spacing.lg,
    gap: 12,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.hairline,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  title: {
    fontFamily: Theme.typography.display,
    fontSize: 20,
    color: Theme.colors.ink,
  },
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    gap: 12,
  },
  footer: {
    gap: Theme.spacing.sm,
  },
  button: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Theme.colors.purple,
  },
  disabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
  },
  switchLink: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  switchText: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.magenta,
  },
  previewCard: {
    alignItems: "center",
    gap: 3,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.card,
  },
  docPage: {
    width: 120,
    height: 154,
    gap: Theme.spacing.sm,
    padding: Theme.spacing.md,
    marginBottom: 14,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  docLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.surfaceSunken,
  },
  cardTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  caption: {
    fontFamily: Theme.typography.body,
    fontSize: 12,
    lineHeight: 17,
    color: Theme.colors.inkFaint,
    textAlign: "center",
  },
  progress: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: Theme.colors.hairline,
  },
  progressFill: {
    height: "100%",
  },
  progressText: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.inkFaint,
    textAlign: "center",
  },
  qr: {
    width: 170,
    height: 170,
    padding: 14,
    marginBottom: 14,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.surfaceSunken,
  },
  lockedHero: {
    alignItems: "center",
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
  },
  lockedIcon: {
    width: 52,
    height: 52,
    marginBottom: 12,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedTitle: {
    fontFamily: Theme.typography.display,
    fontSize: 19,
    color: Theme.colors.ink,
    textAlign: "center",
  },
  lockedCaption: {
    marginTop: 6,
    fontFamily: Theme.typography.body,
    fontSize: 12,
    color: Theme.colors.inkSoft,
    textAlign: "center",
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  featureText: {
    flex: 1,
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
  },
});
