import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Path } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import LineIcon from "@/components/profile/LineIcon";
import { JournalEntryParam, entryText, noteTitle } from "@/components/journal/entry";

const NOTE_LIMIT = 500;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TAGS = ["tagFirstKick", "tagBump", "tagUltrasound", "tagFamily", "tagPet"];

// 4.2 New entry and, when opened with an `item`, 4.4 Edit entry
const NewEntry = () => {
  const params = useLocalSearchParams<{ item?: string }>();
  const editing: JournalEntryParam | null = params.item ? JSON.parse(params.item) : null;
  const initialPhoto = editing?.kind === "photo" ? editing.imageUrl ?? null : null;
  const initialNote = editing ? entryText(editing) : "";
  const user = useSelector((state: any) => state.user);
  const token = useSelector((state: any) => state.user.token);
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();

  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const [note, setNote] = useState(initialNote);
  // Tags are not stored by the backend yet, so the choice is visual only
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS.map((key) => t(`newEntry.${key}`)));
  const [tag, setTag] = useState<string | null>(null);
  const [addingTag, setAddingTag] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [week, setWeek] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [discardAction, setDiscardAction] = useState<any>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const dirty = editing
    ? photo !== initialPhoto || note.trim() !== initialNote.trim() || !!tag
    : !!photo || note.trim().length > 0 || !!tag;
  const hasContent = !!photo || note.trim().length > 0;
  const canSave = hasContent && (!editing || dirty) && !saving;
  // The API can't turn a note into a photo entry (or back), so editing keeps the kind
  const showPhoto = editing?.kind !== "note";
  // Lets the leave guard know when leaving is intended (after saving or discarding)
  const allowLeave = useRef(false);

  useEffect(() => {
    const loadWeek = async () => {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/user/${user?.user_id}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        const totalDays = data?.pregnancyData?.totalDays;
        if (typeof totalDays === "number" && totalDays >= 7) setWeek(Math.floor(totalDays / 7));
      } catch (error) {
        console.error("Error loading pregnancy week:", error);
      }
    };
    if (user?.user_id) loadWeek();
  }, [user?.user_id]);

  // The footer floats over the form; hide it while typing so it doesn't cover the note
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardOpen(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Ask before leaving with unsaved changes (back button, gesture or header)
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event: any) => {
      if (!dirty || allowLeave.current) return;
      event.preventDefault();
      setDiscardAction(event.data.action);
    });
    return unsubscribe;
  }, [navigation, dirty]);

  const pickPhoto = async (source: "camera" | "library") => {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(t("newEntry.permissionTitle"), t("newEntry.permissionText"));
      return;
    }
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    };
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets?.length) setPhoto(result.assets[0].uri);
  };

  // Photo menu: pick from camera or library; with a photo, also replace or remove it
  const [photoMenu, setPhotoMenu] = useState(false);
  const choosePhoto = () => setPhotoMenu(true);
  const fromMenu = (action: () => void) => () => {
    setPhotoMenu(false);
    action();
  };

  const confirmCustomTag = () => {
    const value = customTag.trim();
    if (value) {
      if (!tags.includes(value)) setTags((prev) => [...prev, value]);
      setTag(value);
    }
    setCustomTag("");
    setAddingTag(false);
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const text = note.trim();
    try {
      let response: Response;
      if (editing) {
        response = await saveChanges(editing, text);
      } else if (photo) {
        // Photo entries keep the note as their caption. The API requires a title,
        // so a photo without a note sends a single space (trimmed by the timeline).
        const formData = new FormData();
        formData.append("title", text || " ");
        formData.append("imageUrl", { uri: photo, type: "image/jpeg", name: "journal.jpg" } as any);
        response = await fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/journal/upload`, {
          method: "POST",
          headers: { "Content-Type": "multipart/form-data" },
          body: formData,
        });
      } else {
        response = await fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/note`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: noteTitle(text), description: text }),
        });
      }
      if (!response.ok) throw new Error(`Save failed with status ${response.status}`);
      allowLeave.current = true;
      setSaved(true);
    } catch (error) {
      console.error("Error saving journal entry:", error);
      Alert.alert(t("profile.error"), t("newEntry.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const saveChanges = (entry: JournalEntryParam, text: string) => {
    if (entry.kind === "photo") {
      const formData = new FormData();
      formData.append("title", text || " ");
      if (photo && photo !== initialPhoto) {
        formData.append("imageUrl", { uri: photo, type: "image/jpeg", name: "journal.jpg" } as any);
      } else {
        formData.append("imageUrl", initialPhoto ?? "");
      }
      return fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/journal/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });
    }
    return fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}/note/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: noteTitle(text), description: text }),
    });
  };

  const today = new Date().toLocaleDateString(i18n.language, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const footerDate = [today, week ? t("newEntry.week", { week }) : null].filter(Boolean).join(" · ");

  if (saved) {
    // 4.6 — Saved
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.done}>
          <View style={styles.doneIcon}>
            <LineIcon size={34} color={Theme.colors.surface}>
              <Path d="M5 12.5l4.5 4.5L19 7" />
            </LineIcon>
          </View>
          <Text style={styles.doneTitle}>
            {editing ? t("newEntry.changesSaved") : t("newEntry.savedTitle")}
          </Text>
          <Text style={styles.doneText}>
            {editing ? t("newEntry.changesSavedText") : t("newEntry.savedText")}
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.doneButton]}
            // After editing, also close the (now outdated) entry screen
            onPress={() => (editing ? router.dismiss(2) : router.back())}
          >
            <Text style={styles.buttonText}>{t("newEntry.backToJournal")}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <AuthTopBar
            title={editing ? t("newEntry.editTitle") : t("newEntry.title")}
            onBack={() => router.back()}
          />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {showPhoto && (
            <View style={styles.section}>
              <Text style={styles.label}>
                {t("newEntry.photo")} <Text style={styles.optional}>{t("newEntry.optional")}</Text>
              </Text>
              <TouchableOpacity
                style={[styles.photoBox, photo && styles.photoBoxFilled]}
                onPress={choosePhoto}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={photo ? t("newEntry.editPhoto") : t("newEntry.addPhoto")}
              >
                {photo ? (
                  <>
                    <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    <View style={styles.photoEdit}>
                      <LineIcon size={16} color={Theme.colors.magenta}>
                        <Path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <Path d="m15 5 4 4" />
                      </LineIcon>
                    </View>
                  </>
                ) : (
                  <>
                    <LineIcon size={26} color={Theme.colors.purple}>
                      <Path d="M4 8h3l1.6-2h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
                      <Path d="M15.4 13a3.4 3.4 0 1 1-6.8 0 3.4 3.4 0 0 1 6.8 0Z" />
                    </LineIcon>
                    <Text style={styles.photoTitle}>{t("newEntry.addPhoto")}</Text>
                    <Text style={styles.photoHint}>{t("newEntry.cameraOrLibrary")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            )}

            <View style={styles.section}>
              <Text style={styles.label}>
                {t("newEntry.note")} <Text style={styles.optional}>{t("newEntry.optional")}</Text>
              </Text>
              <View>
                <TextInput
                  style={styles.note}
                  value={note}
                  onChangeText={setNote}
                  placeholder={t("newEntry.notePlaceholder")}
                  placeholderTextColor={Theme.colors.inkFaint}
                  maxLength={NOTE_LIMIT}
                  multiline
                  textAlignVertical="top"
                />
                <Text style={styles.count}>
                  {note.length}/{NOTE_LIMIT}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>
                {t("newEntry.tags")} <Text style={styles.optional}>{t("newEntry.optional")}</Text>
              </Text>
              <View style={styles.tags}>
                {tags.map((name) => {
                  const isOn = tag === name;
                  return (
                    <TouchableOpacity
                      key={name}
                      style={[styles.chip, isOn && styles.chipOn]}
                      onPress={() => setTag(isOn ? null : name)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isOn }}
                    >
                      <Text style={[styles.chipText, isOn && styles.chipTextOn]}>{name}</Text>
                      {isOn && (
                        <LineIcon size={14} color={Theme.colors.surface}>
                          <Path d="M6 6l12 12M18 6 6 18" />
                        </LineIcon>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {addingTag ? (
                  <TextInput
                    style={[styles.chip, styles.chipInput]}
                    value={customTag}
                    onChangeText={setCustomTag}
                    placeholder={t("newEntry.tagPlaceholder")}
                    placeholderTextColor={Theme.colors.inkFaint}
                    autoFocus
                    maxLength={20}
                    returnKeyType="done"
                    onSubmitEditing={confirmCustomTag}
                    onBlur={confirmCustomTag}
                  />
                ) : (
                  <TouchableOpacity style={styles.chip} onPress={() => setAddingTag(true)}>
                    <Text style={[styles.chipText, styles.chipAdd]}>{t("newEntry.addTag")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>

          {!keyboardOpen && (
          <LinearGradient colors={["transparent", Theme.colors.bg]} locations={[0, 0.26]} style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, !canSave && styles.buttonOff]}
              onPress={save}
              disabled={!canSave}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator color={Theme.colors.surface} />
              ) : (
                <>
                  <LineIcon size={18} color={canSave ? Theme.colors.surface : Theme.colors.disabledText}>
                    {editing ? (
                      <Path d="M5 12.5l4.5 4.5L19 7" />
                    ) : (
                      <>
                        <Path d="M5 3h11l3 3v15H5z" />
                        <Path d="M8 3v6h7V3M8 21v-7h8v7" />
                      </>
                    )}
                  </LineIcon>
                  <Text style={[styles.buttonText, !canSave && styles.buttonTextOff]}>
                    {editing ? t("newEntry.saveChanges") : t("newEntry.save")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.footerNote}>
              {editing ? t("newEntry.sameDate") : t("newEntry.addedToday", { date: footerDate })}
            </Text>
          </LinearGradient>
          )}
        </KeyboardAvoidingView>

        {/* Photo menu */}
        <Modal
          visible={photoMenu}
          transparent
          statusBarTranslucent
          animationType="slide"
          onRequestClose={() => setPhotoMenu(false)}
        >
          <TouchableOpacity
            style={styles.sheetScrim}
            activeOpacity={1}
            onPress={() => setPhotoMenu(false)}
          >
            <View style={styles.sheet} onStartShouldSetResponder={() => true}>
              <Text style={styles.sheetTitle}>{t("newEntry.photoMenuTitle")}</Text>
              <TouchableOpacity
                style={[styles.sheetButton, styles.sheetPrimary]}
                onPress={fromMenu(() => pickPhoto("library"))}
              >
                <Text style={[styles.sheetText, { color: Theme.colors.magenta }]}>
                  {photo ? t("newEntry.chooseAnother") : t("newEntry.chooseLibrary")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetButton} onPress={fromMenu(() => pickPhoto("camera"))}>
                <Text style={styles.sheetText}>{t("newEntry.takePhoto")}</Text>
              </TouchableOpacity>
              {/* Editing can't turn a photo entry into a note, so removing is only for new entries */}
              {photo && !editing && (
                <TouchableOpacity
                  style={[styles.sheetButton, styles.sheetDanger]}
                  onPress={fromMenu(() => setPhoto(null))}
                >
                  <Text style={[styles.sheetText, { color: Theme.colors.danger }]}>
                    {t("newEntry.removePhoto")}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.sheetButton, styles.sheetCancel]} onPress={() => setPhotoMenu(false)}>
                <Text style={[styles.sheetText, { color: Theme.colors.inkSoft }]}>{t("profile.cancel")}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 4.5 — Discard changes */}
        <Modal
          visible={!!discardAction}
          transparent
          statusBarTranslucent
          animationType="fade"
          onRequestClose={() => setDiscardAction(null)}
        >
          <View style={styles.dialogScrim}>
            <View style={styles.dialog} accessibilityRole="alert">
              <View style={styles.dialogIcon}>
                <Text style={styles.dialogIconText}>!</Text>
              </View>
              <Text style={styles.dialogTitle}>{t("newEntry.discardTitle")}</Text>
              <Text style={styles.dialogText}>{t("newEntry.discardText")}</Text>
              <View style={styles.dialogRow}>
                <TouchableOpacity style={styles.dialogButton} onPress={() => setDiscardAction(null)}>
                  <Text style={[styles.buttonText, { color: Theme.colors.magenta }]}>
                    {t("newEntry.keepEditing")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dialogButton, styles.dialogButtonGo]}
                  onPress={() => {
                    const action = discardAction;
                    allowLeave.current = true;
                    setDiscardAction(null);
                    navigation.dispatch(action);
                  }}
                >
                  <Text style={styles.buttonText}>{t("newEntry.discard")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ScreenBackground>
  );
};

export default NewEntry;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  section: {
    marginHorizontal: 22,
    marginBottom: 12,
  },
  label: {
    fontFamily: Theme.typography.heading,
    fontSize: 14,
    color: Theme.colors.ink,
    marginBottom: Theme.spacing.sm,
  },
  optional: {
    fontFamily: Theme.typography.caption,
    fontSize: 12,
    color: Theme.colors.inkFaint,
  },
  photoBox: {
    height: 150,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.xs,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Theme.colors.dropzoneBorder,
    backgroundColor: Theme.colors.purpleTint,
  },
  photoBoxFilled: {
    borderWidth: 0,
  },
  photoTitle: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.purple,
  },
  photoHint: {
    fontFamily: Theme.typography.body,
    fontSize: 11,
    color: Theme.colors.inkSoft,
  },
  photoEdit: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Theme.colors.tagOnPhoto,
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: 14,
    paddingBottom: 28,
    fontFamily: Theme.typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: Theme.colors.ink,
  },
  count: {
    position: "absolute",
    right: 14,
    bottom: Theme.spacing.sm,
    fontFamily: Theme.typography.body,
    fontSize: 11,
    color: Theme.colors.inkFaint,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  chipOn: {
    backgroundColor: Theme.colors.magenta,
    borderColor: Theme.colors.magenta,
  },
  chipText: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
  },
  chipTextOn: {
    color: Theme.colors.surface,
  },
  chipAdd: {
    color: Theme.colors.magenta,
  },
  chipInput: {
    minWidth: 120,
    borderColor: Theme.colors.magenta,
    borderWidth: 2,
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
    paddingVertical: 0,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.sm,
    minHeight: 52,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.magenta,
  },
  buttonOff: {
    backgroundColor: Theme.colors.disabledBg,
  },
  buttonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.surface,
  },
  buttonTextOff: {
    color: Theme.colors.disabledText,
  },
  footerNote: {
    textAlign: "center",
    fontFamily: Theme.typography.body,
    fontSize: 10.5,
    color: Theme.colors.inkFaint,
    marginTop: Theme.spacing.sm,
  },
  sheetScrim: {
    flex: 1,
    backgroundColor: Theme.colors.scrim,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingTop: Theme.spacing.md,
    paddingHorizontal: 18,
    paddingBottom: 36,
    gap: Theme.spacing.sm,
  },
  sheetTitle: {
    textAlign: "center",
    fontFamily: Theme.typography.display,
    fontSize: 16,
    color: Theme.colors.ink,
    marginBottom: Theme.spacing.xs,
  },
  sheetButton: {
    minHeight: 48,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPrimary: {
    borderColor: Theme.colors.magenta,
  },
  sheetDanger: {
    borderColor: "transparent",
    backgroundColor: Theme.colors.dangerTint,
  },
  sheetCancel: {
    borderColor: "transparent",
  },
  sheetText: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.ink,
  },
  dialogScrim: {
    flex: 1,
    backgroundColor: Theme.colors.scrim,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  dialog: {
    width: "100%",
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xl,
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: Theme.spacing.md,
    alignItems: "center",
  },
  dialogIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.sm,
  },
  dialogIconText: {
    fontFamily: Theme.typography.heading,
    fontSize: 20,
    color: Theme.colors.magenta,
  },
  dialogTitle: {
    fontFamily: Theme.typography.display,
    fontSize: 16,
    color: Theme.colors.ink,
  },
  dialogText: {
    fontFamily: Theme.typography.body,
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.inkSoft,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  dialogRow: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "stretch",
  },
  dialogButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: Theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogButtonGo: {
    backgroundColor: Theme.colors.magenta,
  },
  done: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 6,
  },
  doneIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.lg,
    borderWidth: 10,
    borderColor: Theme.colors.magentaTint,
  },
  doneTitle: {
    fontFamily: Theme.typography.display,
    fontSize: 20,
    color: Theme.colors.ink,
  },
  doneText: {
    fontFamily: Theme.typography.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: Theme.colors.inkSoft,
    textAlign: "center",
    marginBottom: 18,
  },
  doneButton: {
    width: "100%",
    maxWidth: 260,
    paddingHorizontal: Theme.spacing.lg,
  },
});
