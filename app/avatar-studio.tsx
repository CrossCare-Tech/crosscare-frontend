import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { Theme } from "@/constants/theme";
import { AVATAR_GUIDES, AVATAR_OUTFITS, AVATAR_TONES, AvatarItem } from "@/constants/avatarCatalog";
import { AvatarChoice, avatarImage, useAvatarStudio } from "@/zustandStore/avatarStudioStore";

type TabId = "guide" | "tone" | "hair" | "outfit";
const TABS: TabId[] = ["guide", "tone", "hair", "outfit"];
const TAB_KEY: Record<TabId, string> = {
  guide: "avatarStudio.guide",
  tone: "avatarStudio.skinTone",
  hair: "avatarStudio.hairstyle",
  outfit: "avatarStudio.outfit",
};

// Visual build of the app's Avatar Selection from the prototype /avatar-studio/.
// Guide and skin tone are never locked; hairstyles and outfits are (unlock rules are shown, not enforced yet).
const isOpen = (item: AvatarItem) => item.rule === "start";

export default function AvatarStudio() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const saved = useAvatarStudio((s) => s.choice);
  const save = useAvatarStudio((s) => s.save);
  const [draft, setDraft] = useState<AvatarChoice>(saved);
  const [tab, setTab] = useState<TabId>("hair");

  const load = useAvatarStudio((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setDraft(saved), [saved]);

  const guide = AVATAR_GUIDES.find((g) => g.id === draft.guide) ?? AVATAR_GUIDES[0];
  const hair = guide.hairstyles.find((h) => h.id === draft.hair) ?? guide.hairstyles[0];
  const outfit = AVATAR_OUTFITS.find((o) => o.id === draft.outfit) ?? AVATAR_OUTFITS[0];
  const locked = [hair, outfit].find((i) => !isOpen(i));

  const update = (patch: Partial<AvatarChoice>) => {
    const next = { ...draft, ...patch };
    // Hairstyles belong to a guide: keep the nearest valid one when the guide changes.
    const g = AVATAR_GUIDES.find((x) => x.id === next.guide)!;
    if (!g.hairstyles.some((h) => h.id === next.hair)) next.hair = 1;
    setDraft(next);
  };

  // Opened by a link there is nothing to go back to: land on the Concierge history instead.
  const leave = () => (router.canGoBack() ? router.back() : router.replace("/patient/concierge-history"));

  const done = async () => {
    await save(draft);
    leave();
  };

  const previewSize = Math.min(width - Theme.spacing.lg * 2, 300);
  const gridGap = Theme.spacing.sm + 4;
  const cols = tab === "tone" ? 4 : 3;
  const cardW = Math.floor((width - Theme.spacing.md * 2 - gridGap * (cols - 1)) / cols);

  const cards = useMemo(() => {
    if (tab === "guide") {
      return AVATAR_GUIDES.map((g) => ({
        key: g.id,
        label: g.name,
        img: avatarImage({ ...draft, guide: g.id, hair: 1 }),
        on: g.id === draft.guide,
        item: null as AvatarItem | null,
        pick: () => update({ guide: g.id }),
      }));
    }
    if (tab === "tone") {
      return AVATAR_TONES.map((tn) => ({
        key: String(tn.id),
        label: tn.label,
        img: avatarImage({ ...draft, tone: tn.id }),
        on: tn.id === draft.tone,
        item: null as AvatarItem | null,
        pick: () => update({ tone: tn.id }),
        swatch: tn.hex,
      }));
    }
    if (tab === "hair") {
      return guide.hairstyles.map((h) => ({
        key: String(h.id),
        label: h.label,
        img: avatarImage({ ...draft, hair: h.id }),
        on: h.id === draft.hair,
        item: h,
        pick: () => update({ hair: h.id }),
      }));
    }
    return AVATAR_OUTFITS.map((o) => ({
      key: String(o.id),
      label: o.label,
      img: avatarImage({ ...draft, outfit: o.id }),
      on: o.id === draft.outfit,
      item: o,
      pick: () => update({ outfit: o.id }),
    }));
  }, [tab, draft, guide]);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={leave} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.cancel}>{t("avatarStudio.cancel")}</Text>
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            {t("avatarStudio.title")}
          </Text>
          <Pressable onPress={done} disabled={!!locked} accessibilityRole="button" accessibilityState={{ disabled: !!locked }} hitSlop={12}>
            <Text style={[styles.done, !!locked && styles.doneOff]}>{t("avatarStudio.done")}</Text>
          </Pressable>
        </View>

        <View style={styles.previewWrap}>
          <View style={[styles.preview, { width: previewSize, height: previewSize }]}>
            <Image source={avatarImage(draft)} style={[styles.previewImg, !!locked && styles.dim]} resizeMode="cover" />
            {locked && (
              <View style={styles.previewLock}>
                <Feather name="lock" size={16} color={Theme.colors.magenta} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{guide.name}</Text>
          {locked ? (
            <Text style={styles.hint}>{t("avatarStudio.unlockHint", { rule: locked.text })}</Text>
          ) : (
            <Text style={styles.hint}>
              {hair.label} · {outfit.label}
            </Text>
          )}
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((id) => (
            <Pressable
              key={id}
              onPress={() => setTab(id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === id }}
              style={[styles.tab, tab === id && styles.tabOn]}
            >
              <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>{t(TAB_KEY[id])}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={[styles.grid, { gap: gridGap }]}>
          {cards.map((c) => {
            const isLocked = !!c.item && !isOpen(c.item);
            return (
              <Pressable
                key={c.key}
                onPress={c.pick}
                accessibilityRole="radio"
                accessibilityState={{ checked: c.on }}
                accessibilityLabel={isLocked ? `${c.label}, ${t("avatarStudio.locked")}: ${c.item!.text}` : c.label}
                style={[styles.card, { width: cardW }, c.on && styles.cardOn, isLocked && styles.cardLocked]}
              >
                <Image source={c.img} style={[styles.cardImg, { height: cardW - 12 }, isLocked && styles.dim]} resizeMode="cover" />
                <View style={styles.cardLabelRow}>
                  {"swatch" in c && <View style={[styles.swatch, { backgroundColor: (c as any).swatch }]} />}
                  <Text style={styles.cardLabel} numberOfLines={2}>
                    {c.label}
                  </Text>
                </View>
                {isLocked && (
                  <View style={styles.lockBadge}>
                    <Feather name="lock" size={11} color={Theme.colors.magenta} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Theme.spacing.md + 4,
    paddingVertical: Theme.spacing.sm + 4,
  },
  cancel: { fontFamily: Theme.typography.caption, fontSize: 15, color: Theme.colors.inkFaint },
  title: { fontFamily: Theme.typography.heading, fontSize: 16, color: Theme.colors.ink },
  done: { fontFamily: Theme.typography.heading, fontSize: 15, color: Theme.colors.magenta },
  doneOff: { color: Theme.colors.disabledText },
  previewWrap: { alignItems: "center", paddingTop: Theme.spacing.sm },
  preview: {
    borderRadius: Theme.borderRadius.xl,
    overflow: "hidden",
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.soft,
  },
  previewImg: { width: "100%", height: "100%" },
  dim: { opacity: 0.55 },
  previewLock: {
    position: "absolute",
    right: Theme.spacing.sm + 4,
    bottom: Theme.spacing.sm + 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.magentaTint,
  },
  name: { marginTop: Theme.spacing.sm + 4, fontFamily: Theme.typography.display, fontSize: 22, color: Theme.colors.ink },
  hint: { marginTop: 2, fontFamily: Theme.typography.body, fontSize: 13, color: Theme.colors.inkFaint, textAlign: "center", paddingHorizontal: Theme.spacing.lg },
  tabs: {
    flexDirection: "row",
    marginTop: Theme.spacing.md,
    marginHorizontal: Theme.spacing.md,
    padding: 4,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.surfaceSunken,
  },
  tab: { flex: 1, height: 38, alignItems: "center", justifyContent: "center", borderRadius: Theme.borderRadius.md },
  tabOn: { backgroundColor: Theme.colors.surface, ...Theme.shadows.card },
  tabText: { fontFamily: Theme.typography.caption, fontSize: 12.5, color: Theme.colors.inkFaint },
  tabTextOn: { fontFamily: Theme.typography.heading, color: Theme.colors.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: Theme.spacing.md, paddingBottom: Theme.spacing.xl },
  card: {
    padding: 6,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
    ...Theme.shadows.card,
  },
  cardOn: { borderColor: Theme.colors.magentaVivid, backgroundColor: Theme.colors.magentaWash },
  cardLocked: { backgroundColor: Theme.colors.surfaceSubtle },
  cardImg: { width: "100%", borderRadius: Theme.borderRadius.md },
  cardLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 6, paddingBottom: 2, minHeight: 34 },
  swatch: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: Theme.colors.hairline },
  cardLabel: { flexShrink: 1, fontFamily: Theme.typography.caption, fontSize: 11.5, color: Theme.colors.ink, textAlign: "center" },
  lockBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.magentaTint,
  },
});
