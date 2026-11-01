import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { daysAgo, fmtDate, useActivityHistory } from "@/components/vitals/MetricUI";
import { BP_READING_TIME_KEY, warnIfBackdateIgnored } from "@/components/vitals/backdate";
import { ChipSelect, DateTimeField, useRecordedAt, vitalsStyles } from "@/components/vitals/VitalsUI";
import { GLUCOSE_CONTEXTS } from "./modal/glucosemodal";
import { convertWeight, useUnitStore } from "@/zustandStore/unitStore";

type Vital = "bp" | "glucose" | "weight" | "heart";
const VITALS: { id: Vital; label: string }[] = [
  { id: "bp", label: "bloodPressureLog.title" },
  { id: "glucose", label: "glucoseLog.title" },
  { id: "weight", label: "weightLog.title" },
  { id: "heart", label: "heartLog.title" },
];

// Prototype 5.3 "Manual Input Fallback": the manual form for when the device does not sync, with the vital
// sign chosen on the screen. The pop-ups on each vital screen stay the usual way to add a reading.
// ponytail: the save requests repeat those of the pop-ups; share them if a fourth entry point appears.
export default function ManualEntryScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ vital?: string }>();
  const user = useSelector((state: any) => state.user);
  const { weightUnit } = useUnitStore();
  const reading = useRecordedAt();
  const [vital, setVital] = useState<Vital>(VITALS.some((v) => v.id === params.vital) ? (params.vital as Vital) : "bp");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [glucose, setGlucose] = useState("");
  const [glucoseContext, setGlucoseContext] = useState("");
  const [weight, setWeight] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [loading, setLoading] = useState(false);
  const { activities } = useActivityHistory();

  // The pop-ups of each vital screen work in the unit of the latest glucose reading
  const latestGlucose = [...activities].reverse().find((a) => a.details?.glucose?.value > 0)?.details.glucose;
  const glucoseUnit: string = latestGlucose?.unit || "mg/dL";

  // Like the pop-ups, start from today's reading when there is one (glucose, weight and heart rate)
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || activities.length === 0) return;
    prefilled.current = true;
    const today = activities.find((a) => a.date === fmtDate(daysAgo(0)))?.details;
    if (today?.glucose?.value > 0) {
      setGlucose(String(today.glucose.value));
      setGlucoseContext(today.glucose.mealContext || "");
    }
    if (today?.weight?.value > 0) {
      const from = today.weight.unit === "lbs" ? "lbs" : "kg";
      setWeight(String(Math.round(convertWeight(today.weight.value, from, weightUnit) * 10) / 10));
    }
    if (today?.heart > 0) setHeartRate(String(today.heart));
  }, [activities, weightUnit]);

  const fail = (message: string) => Alert.alert(t("vitalsEntry.errorTitle"), message);

  const save = async () => {
    let path = "";
    let body: Record<string, unknown> = {};
    let hasReading: (details: any) => boolean = () => true;

    if (vital === "bp") {
      if (!systolic || !diastolic) return fail(t("vitalsEntry.bpMissing"));
      if (isNaN(Number(systolic)) || isNaN(Number(diastolic))) return fail(t("vitalsEntry.bpInvalid"));
      path = "bp";
      body = { systolic: parseInt(systolic), diastolic: parseInt(diastolic) };
      hasReading = (details) => details?.bloodPressure?.systolic > 0;
    } else if (vital === "glucose") {
      if (!glucose) return fail(t("vitalsEntry.glucoseMissing"));
      const value = Number(glucose);
      if (!Number.isFinite(value) || value <= 0) return fail(t("vitalsEntry.glucoseInvalid"));
      if (!user?.token) return fail(t("vitalsEntry.loginAgain"));
      path = "glucose";
      body = { glucoseLevel: value, glucoseUnit, glucoseMealContext: glucoseContext.trim() || null };
      hasReading = (details) => details?.glucose?.value > 0;
    } else if (vital === "heart") {
      if (!heartRate) return fail(t("heartLog.missing"));
      const bpm = Number(heartRate);
      if (!Number.isFinite(bpm) || bpm < 30 || bpm > 220) return fail(t("heartLog.invalid"));
      path = "heart";
      body = { heartRate: bpm };
      hasReading = (details) => details?.heart > 0;
    } else {
      if (!weight) return fail(t("weightLog.missing"));
      const value = Number(weight.replace(",", "."));
      if (!Number.isFinite(value) || value <= 0) return fail(t("weightLog.invalid"));
      path = "weight";
      body = { weight: weightUnit === "lbs" ? convertWeight(value, "lbs", "kg") : value, weight_unit: "kg" };
      hasReading = (details) => details?.weight?.value > 0;
    }
    if (!user?.user_id) return fail(t("vitalsEntry.loginAgain"));

    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({ ...body, ...reading.payload }),
      });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);

      const savedAt = reading.recordedAt;
      if (vital === "bp") {
        // Same note the blood pressure pop-up leaves for the alert (5.5)
        const takenAt = savedAt ?? new Date();
        AsyncStorage.setItem(
          BP_READING_TIME_KEY,
          JSON.stringify({ key: `${fmtDate(takenAt)} ${parseInt(systolic)}/${parseInt(diastolic)}`, at: takenAt.toISOString() })
        ).catch(() => undefined);
      }
      warnIfBackdateIgnored({ recordedAt: savedAt, user, hasReading, t });
      router.back();
    } catch (error: any) {
      console.warn("Error saving manual reading:", error?.message);
      fail(t("vitalsEntry.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar title={t("vitalsEntry.manualEntry")} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.banner} accessibilityRole="alert">
            <View style={styles.bannerBar} />
            <Text style={styles.bannerTitle}>{t("vitalsEntry.syncUnavailable")}</Text>
            <Text style={styles.bannerSub}>{t("vitalsEntry.syncUnavailableHint")}</Text>
          </View>

          <View style={vitalsStyles.field}>
            <Text style={vitalsStyles.label}>{t("vitalsEntry.vitalSign")}</Text>
            <View style={vitalsStyles.chips}>
              {VITALS.map((option) => (
                <ChipSelect key={option.id} label={t(option.label)} selected={vital === option.id} onPress={() => setVital(option.id)} />
              ))}
            </View>
          </View>

          {vital === "bp" && (
            <View style={vitalsStyles.row}>
              <View style={styles.half}>
                <CustomTextInput
                  label={t("vitalsEntry.systolic")}
                  value={systolic}
                  onChangeText={(value) => setSystolic(value.replace(/\D/g, ""))}
                  placeholder="118"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={styles.half}>
                <CustomTextInput
                  label={t("vitalsEntry.diastolic")}
                  value={diastolic}
                  onChangeText={(value) => setDiastolic(value.replace(/\D/g, ""))}
                  placeholder="76"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
          )}

          {vital === "glucose" && (
            <>
              <CustomTextInput
                label={t("vitalsEntry.glucoseLevel", { unit: glucoseUnit })}
                value={glucose}
                onChangeText={(value) => setGlucose(value.replace(/[^\d.]/g, ""))}
                placeholder="92"
                keyboardType="decimal-pad"
                maxLength={5}
              />
              <View style={vitalsStyles.field}>
                <Text style={vitalsStyles.label}>{t("vitalsEntry.readingType")}</Text>
                <View style={vitalsStyles.chips}>
                  {GLUCOSE_CONTEXTS.map((option) => (
                    <ChipSelect
                      key={option.value}
                      label={t(`vitalsEntry.${option.key}`)}
                      selected={glucoseContext === option.value}
                      onPress={() => setGlucoseContext(glucoseContext === option.value ? "" : option.value)}
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          {vital === "weight" && (
            <CustomTextInput
              label={t("weightLog.inputLabel", { unit: weightUnit })}
              value={weight}
              onChangeText={(value) => setWeight(value.replace(/[^\d.,]/g, ""))}
              placeholder={weightUnit === "lbs" ? "148" : "67"}
              keyboardType="decimal-pad"
              maxLength={5}
            />
          )}

          {vital === "heart" && (
            <CustomTextInput
              label={t("heartLog.inputLabel")}
              value={heartRate}
              onChangeText={(value) => setHeartRate(value.replace(/\D/g, ""))}
              placeholder="84"
              keyboardType="number-pad"
              maxLength={3}
            />
          )}

          <DateTimeField recordedAt={reading.recordedAt} onChange={reading.setRecordedAt} />

          <TouchableOpacity style={styles.save} onPress={save} disabled={loading} accessibilityRole="button">
            {loading ? (
              <ActivityIndicator color={Theme.colors.surface} />
            ) : (
              <Text style={styles.saveText}>{t("vitalsEntry.saveReading")}</Text>
            )}
          </TouchableOpacity>
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
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.sm,
    paddingBottom: 40,
    gap: Theme.spacing.md,
  },
  banner: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    overflow: "hidden",
    paddingVertical: 14,
    paddingLeft: Theme.spacing.md + 4,
    paddingRight: Theme.spacing.md,
    gap: 3,
  },
  // The colored edge of the prototype banner (a border would not follow the rounded corner on Android)
  bannerBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Theme.colors.warning,
  },
  bannerTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.ink,
  },
  bannerSub: {
    fontFamily: Theme.typography.body,
    fontSize: 12.5,
    color: Theme.colors.inkFaint,
  },
  half: {
    flex: 1,
  },
  save: {
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Theme.spacing.xs,
  },
  saveText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.surface,
  },
});
