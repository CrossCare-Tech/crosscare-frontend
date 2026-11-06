import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import {
  ALL_BADGE_TYPES,
  BADGE_IMAGES,
  LOCKED_BADGE_IMAGES,
  badgeDescriptionKey,
  badgeTipKey,
  badgeTitle,
} from "@/constants/badges";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";

type EarnedBadge = {
  awardedAt: string;
  badge: { type: string };
};

type BadgeItem = {
  type: string;
  earned: boolean;
  awardedAt?: string;
};

const COLUMNS = 3;
const GRID_GAP = 12;

const badgeImage = (item: BadgeItem) =>
  item.earned
    ? BADGE_IMAGES[item.type]
    : LOCKED_BADGE_IMAGES[item.type] || BADGE_IMAGES[item.type];

// Prototype `.badge-tile`: artwork above a short label, faded when locked
const BadgeTile = ({
  item,
  width,
  onPress,
}: {
  item: BadgeItem;
  width: number;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.tile, { width }, !item.earned && styles.tileLocked]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={badgeTitle(item.type)}
  >
    <Image source={badgeImage(item)} style={styles.tileImage} resizeMode="contain" />
    <Text style={styles.tileLabel} numberOfLines={2}>
      {badgeTitle(item.type)}
    </Text>
  </TouchableOpacity>
);

const HallOfFame = () => {
  const user = useSelector((state: any) => state.user);
  const token = useSelector((state: any) => state.user.token);
  const { t, i18n } = useTranslation();

  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BadgeItem | null>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const tileWidth = (gridWidth - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

  const fetchBadges = async () => {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/user/${user?.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (Array.isArray(data)) setEarned(data);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.user_id && token) {
      fetchBadges();
    } else {
      setLoading(false);
    }
  }, [user?.user_id, token]);

  // Earned badges first (in the order they were awarded), then the locked ones
  const earnedTypes = new Set(earned.map((item) => item.badge.type));
  const items: BadgeItem[] = [
    ...earned
      .filter((item) => BADGE_IMAGES[item.badge.type])
      .map((item) => ({
        type: item.badge.type,
        earned: true,
        awardedAt: item.awardedAt,
      })),
    ...ALL_BADGE_TYPES.filter((type) => !earnedTypes.has(type)).map((type) => ({
      type,
      earned: false,
    })),
  ];
  const earnedCount = items.filter((item) => item.earned).length;

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AuthTopBar title={t("profile.halloffame")} />
        <View style={styles.content}>
          <LinearGradient
            colors={[Theme.colors.magentaTint, Theme.colors.purpleTint]}
            start={{ x: 0.25, y: 0.07 }}
            end={{ x: 0.75, y: 0.93 }}
            style={styles.hero}
          >
            <Text style={styles.heroCount}>
              {t("profile.milestones", { count: earnedCount })}
            </Text>
            <Text style={styles.heroSub}>{t("profile.milestonesSubtitle")}</Text>
          </LinearGradient>

          {loading ? (
            <ActivityIndicator color={Theme.colors.magenta} />
          ) : (
            <View
              style={styles.grid}
              onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
            >
              {gridWidth > 0 && items.map((item) => (
                <BadgeTile
                  key={item.type}
                  item={item}
                  width={tileWidth}
                  onPress={() => setSelected(item)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!selected}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
          {selected && (
            <Pressable style={styles.modalCard}>
              <Image
                source={badgeImage(selected)}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <Text style={styles.modalTitle}>{badgeTitle(selected.type)}</Text>
              <Text style={styles.modalStatus}>
                {selected.earned && selected.awardedAt
                  ? t("profile.badgeEarnedOn", {
                      date: new Date(selected.awardedAt).toLocaleDateString(
                        i18n.language,
                        { year: "numeric", month: "long", day: "numeric" }
                      ),
                    })
                  : t("profile.badgeLocked")}
              </Text>
              <Text style={styles.modalText}>
                {t(badgeDescriptionKey(selected.type))}
              </Text>
              {!selected.earned && (
                <View style={styles.tip}>
                  <Text style={styles.modalText}>
                    <Text style={styles.tipLabel}>{t("tip")}: </Text>
                    {t(badgeTipKey(selected.type))}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={() => setSelected(null)}
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>{t("profile.close")}</Text>
              </TouchableOpacity>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
    </ScreenBackground>
  );
};

export default HallOfFame;

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
  hero: {
    borderRadius: 26,
    padding: Theme.spacing.lg,
    alignItems: "center",
    overflow: "hidden",
  },
  heroCount: {
    fontFamily: Theme.typography.display,
    fontSize: 26,
    color: Theme.colors.ink,
  },
  heroSub: {
    fontFamily: Theme.typography.body,
    fontSize: 12,
    color: Theme.colors.inkSoft,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  tile: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.sm,
    alignItems: "center",
    gap: 6,
  },
  tileLocked: {
    // The locked artwork is already greyscale, so fade less than the prototype's 0.4
    opacity: 0.7,
  },
  tileImage: {
    width: 56,
    height: 56,
  },
  tileLabel: {
    fontFamily: Theme.typography.heading,
    fontSize: 10,
    color: Theme.colors.inkSoft,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Theme.colors.scrim,
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: Theme.spacing.lg,
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  modalImage: {
    width: 140,
    height: 140,
  },
  modalTitle: {
    fontFamily: Theme.typography.display,
    fontSize: 22,
    color: Theme.colors.ink,
    textAlign: "center",
  },
  modalStatus: {
    fontFamily: Theme.typography.heading,
    fontSize: 12,
    color: Theme.colors.magenta,
  },
  modalText: {
    fontFamily: Theme.typography.body,
    fontSize: 13.5,
    color: Theme.colors.inkSoft,
    textAlign: "center",
  },
  tip: {
    backgroundColor: Theme.colors.purpleTint,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    alignSelf: "stretch",
  },
  tipLabel: {
    fontFamily: Theme.typography.heading,
    color: Theme.colors.purple,
  },
  button: {
    alignSelf: "stretch",
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Theme.spacing.sm,
  },
  buttonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.surface,
  },
});
