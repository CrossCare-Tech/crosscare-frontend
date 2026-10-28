import React, { useEffect, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { Theme } from "@/constants/theme";
import { babyImageForWeek } from "@/constants/babyImages";
import { fruitImageForWeek } from "@/constants/babyFruits";
import {
  BABY_WEEK_NUMBERS,
  BABY_WEEKS,
  BabyMeasure,
  BabyPartKey,
  FIRST_BABY_WEEK,
  formatBabyLength,
  formatBabyWeight,
  LAST_BABY_WEEK,
} from "@/constants/babyWeeks";
import { useUnitStore } from "@/zustandStore/unitStore";
import ScreenBackground from "@/components/ui/ScreenBackground";
import AuthTopBar from "@/components/ui/AuthTopBar";
import LineIcon from "@/components/profile/LineIcon";

type Mode = "baby" | "compare";

const SIDE = 20;

const CHIP = 36;
const CHIP_GAP = 8;
const CHIP_STEP = CHIP + CHIP_GAP;

// Each part keeps one accent from the palette: dot, icon and its "Did you know?" box
const PART_STYLE: Record<BabyPartKey, { color: string; tint: string; icon: React.ReactNode }> = {
  development: {
    color: Theme.colors.magenta,
    tint: Theme.colors.magentaTint,
    icon: (
      <>
        <Path d="M12 21v-9" />
        <Path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6Z" />
        <Path d="M12 14c0-3 2.5-5 6-5 0 3-2.5 5-6 5Z" />
      </>
    ),
  },
  organs: {
    color: Theme.colors.purple,
    tint: Theme.colors.purpleTint,
    icon: (
      <>
        <Path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
        <Path d="M12 9v5M9.5 11.5h5" />
      </>
    ),
  },
  brain: {
    color: Theme.colors.teal,
    tint: Theme.colors.tealTint,
    icon: (
      <>
        <Path d="M9 5a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 3 4 3 3 0 0 0 5 1V5a3 3 0 0 0-4 0Z" />
        <Path d="M15 5a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-3 4 3 3 0 0 1-4 1" />
      </>
    ),
  },
  senses: {
    color: Theme.colors.warning,
    tint: Theme.colors.warningTint,
    icon: (
      <>
        <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <Circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  movement: {
    color: Theme.colors.success,
    tint: Theme.colors.successTint,
    icon: (
      <>
        <Circle cx="12" cy="5" r="2" />
        <Path d="M12 8v5M7 10l5-1 5 1M9 21l3-8 3 8" />
      </>
    ),
  },
};

const clampWeek = (week: number) => Math.min(Math.max(week, FIRST_BABY_WEEK), LAST_BABY_WEEK);

// Hero panel at the prototype's 1.45 ratio, sized from the screen width
const useHeroSize = () => {
  const { width } = useWindowDimensions();
  const panelWidth = width - SIDE * 2;
  return { width: panelWidth, height: Math.round(panelWidth / 1.45) };
};

const Measure = ({ parts }: { parts: BabyMeasure }) => (
  <Text style={styles.statValue}>
    {parts.map(([value, unit], index) => (
      <Text key={unit}>
        {index > 0 ? " " : ""}
        {value}
        <Text style={styles.statUnit}> {unit}</Text>
      </Text>
    ))}
  </Text>
);

// The illustration fades into the panel, like the prototype's radial mask
const BabyHero = ({ week, badge, label }: { week: number; badge: string; label: string }) => {
  const size = useHeroSize();

  return (
    <View style={[styles.hero, size]}>
      <Image
        source={babyImageForWeek(week)}
        style={[styles.heroImage, { left: (size.width - size.height) / 2, width: size.height, height: size.height }]}
        accessibilityLabel={label}
      />
      <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height} pointerEvents="none">
        <Defs>
          <RadialGradient
            id="fade"
            cx={size.width / 2}
            cy={size.height / 2}
            r={size.height / 2}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0.62" stopColor={Theme.colors.magentaWash} stopOpacity={0} />
            <Stop offset="1" stopColor={Theme.colors.magentaWash} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Rect width={size.width} height={size.height} fill="url(#fade)" />
      </Svg>
      <Text style={styles.heroBadge}>{badge}</Text>
    </View>
  );
};

// 3.1 — Baby development (prototype v4: week strip + inline details)
export default function BabyDevelopmentScreen() {
  const { t, i18n } = useTranslation();
  const { weeksComplete } = useLocalSearchParams();
  const { weightUnit } = useUnitStore();
  const [week, setWeek] = useState(() => clampWeek(parseInt(String(weeksComplete), 10) || FIRST_BABY_WEEK));
  const [mode, setMode] = useState<Mode>("baby");
  const [openPart, setOpenPart] = useState(-1); // one row open at a time, all closed on a new week
  const [stripWidth, setStripWidth] = useState(0);
  const stripRef = useRef<ScrollView>(null);
  const stripX = useRef(0);
  const pageRef = useRef<ScrollView>(null);
  const partsY = useRef(0);
  const heroSize = useHeroSize();

  const data = BABY_WEEKS[week];
  const left = 40 - week;
  const trimester = week < 14 ? 1 : week < 28 ? 2 : 3;

  // Keep the selected week in the middle of the strip
  useEffect(() => {
    if (!stripWidth) return;
    stripRef.current?.scrollTo({ x: BABY_WEEK_NUMBERS.indexOf(week) * CHIP_STEP, animated: true });
  }, [week, stripWidth]);

  const selectWeek = (next: number) => {
    setWeek(next);
    setOpenPart(-1);
  };

  const selectMode = (next: Mode) => {
    setMode(next);
    pageRef.current?.scrollTo({ y: 0, animated: false });
  };

  // Arrows move the strip by about three weeks without changing the selection
  const scrollStrip = (direction: number) => {
    stripRef.current?.scrollTo({ x: Math.max(0, stripX.current + CHIP_STEP * 3 * direction), animated: true });
  };

  // Prototype wording in English ("a banana", "an ear of corn"); other languages get the name as is
  const objectName = i18n.language.startsWith("en")
    ? `${/^[aeiou]/i.test(data.object) ? "an" : "a"} ${data.object.toLowerCase()}`
    : data.object;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container}>
        <AuthTopBar
          title={t("babyDev.title")}
          action={{ label: t("babyDev.calendar"), onPress: () => router.push("/patient/calendar") }}
        />

        <ScrollView ref={pageRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t("babyDev.weekOf", { week })}</Text>
          <View style={styles.subRow}>
            <Text style={styles.sub}>
              {left <= 0
                ? t("babyDev.dueWeek")
                : left === 1
                  ? t("babyDev.weekLeft")
                  : t("babyDev.weeksLeft", { count: left })}
            </Text>
            <Svg width={12} height={12} viewBox="0 0 24 24">
              <Path
                d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11Z"
                fill={Theme.colors.magenta}
              />
            </Svg>
          </View>

          <View style={styles.weeks}>
            <TouchableOpacity
              style={styles.chev}
              onPress={() => scrollStrip(-1)}
              accessibilityRole="button"
              accessibilityLabel={t("babyDev.earlierWeeks")}
            >
              <Feather name="chevron-left" size={16} color={Theme.colors.inkSoft} />
            </TouchableOpacity>
            <ScrollView
              ref={stripRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.strip}
              onLayout={(event) => setStripWidth(event.nativeEvent.layout.width)}
              onScroll={(event) => (stripX.current = event.nativeEvent.contentOffset.x)}
              scrollEventThrottle={32}
              snapToInterval={CHIP_STEP}
              decelerationRate="fast"
              // Side padding lets the first and last week reach the middle
              contentContainerStyle={[styles.stripContent, { paddingHorizontal: Math.max(0, (stripWidth - CHIP) / 2) }]}
            >
              {BABY_WEEK_NUMBERS.map((number) => {
                const selected = number === week;
                return (
                  <TouchableOpacity
                    key={number}
                    style={[styles.chip, selected && styles.chipOn]}
                    onPress={() => selectWeek(number)}
                    accessibilityRole="button"
                    accessibilityLabel={t("babyDev.weekLabel", { week: number })}
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextOn]}>{number}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.chev}
              onPress={() => scrollStrip(1)}
              accessibilityRole="button"
              accessibilityLabel={t("babyDev.laterWeeks")}
            >
              <Feather name="chevron-right" size={16} color={Theme.colors.inkSoft} />
            </TouchableOpacity>
          </View>

          <View style={styles.seg} accessibilityRole="tablist">
            {(["baby", "compare"] as Mode[]).map((id) => {
              const selected = mode === id;
              const color = selected ? Theme.colors.magenta : Theme.colors.inkSoft;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.segButton, selected && styles.segButtonOn]}
                  onPress={() => selectMode(id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                >
                  <LineIcon size={18} color={color}>
                    {id === "baby" ? (
                      <>
                        <Circle cx="12" cy="13" r="7" />
                        <Path d="M10 12.5h.01M14 12.5h.01M10 15.5c1.2 1 2.8 1 4 0M12 6c0-1.5 1-2.5 2.5-2.5" />
                      </>
                    ) : (
                      <>
                        <Path d="M12 8c-3-2-7 0-7 4.5C5 16 8 20 10 20c1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 5-4 5-7.5C19 8 15 6 12 8Z" />
                        <Path d="M12 8c0-2 1-3.5 3-4" />
                      </>
                    )}
                  </LineIcon>
                  <Text style={[styles.segText, { color }]}>
                    {id === "baby" ? t("babyDev.tabBaby") : t("babyDev.tabCompare")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {mode === "baby" ? (
            <BabyHero
              week={week}
              badge={t(`babyDev.trimester${trimester}`)}
              label={t("babyDev.imageLabel", { week })}
            />
          ) : (
            <View style={[styles.hero, heroSize]}>
              <Image
                source={fruitImageForWeek(week)}
                style={[styles.fruit, { height: heroSize.height * 0.6 }]}
                accessibilityLabel={data.object}
              />
            </View>
          )}
          <Text style={styles.heroLine}>
            {mode === "baby" ? t("babyDev.growing") : t("babyDev.sizeOf", { object: objectName })}
          </Text>
          {mode === "baby" && <Text style={styles.muted}>{t("babyDev.growingHint")}</Text>}

          <View style={styles.stats}>
            <View style={styles.stat}>
              <View style={styles.statLabelRow}>
                <LineIcon size={18} color={Theme.colors.inkSoft}>
                  <Path d="M4 16 16 4l4 4L8 20l-4-4Z" />
                  <Path d="M8 12l2 2M11 9l2 2M14 6l2 2" />
                </LineIcon>
                <Text style={styles.statLabel}>{t("babyDev.length")}</Text>
              </View>
              <Measure parts={formatBabyLength(data.lengthIn, weightUnit)} />
            </View>
            <View style={styles.stat}>
              <View style={styles.statLabelRow}>
                <LineIcon size={18} color={Theme.colors.inkSoft}>
                  <Path d="M6 9h12l2 11H4L6 9Z" />
                  <Path d="M9 9a3 3 0 0 1 6 0" />
                </LineIcon>
                <Text style={styles.statLabel}>{t("babyDev.weight")}</Text>
              </View>
              <Measure parts={formatBabyWeight(data.weightOz, weightUnit)} />
            </View>
          </View>

          {mode === "compare" ? (
            <View style={styles.compareNote}>
              <Text style={styles.compareNoteText}>
                {week < 20 ? t("babyDev.measuredRump") : t("babyDev.measuredHeel")}
              </Text>
              <Text style={styles.compareNoteText}>{t("babyDev.approx")}</Text>
            </View>
          ) : (
            <>
              <View style={styles.big}>
                <View style={styles.bigTop}>
                  <View style={styles.bigIcon}>
                    <Text style={styles.bigEmoji}>{data.big.icon}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.eyebrow}>{t("babyDev.bigThing")}</Text>
                    <View style={styles.bigRow}>
                      <Text style={styles.bigHead}>{data.big.head}</Text>
                      <TouchableOpacity
                        style={styles.go}
                        onPress={() => pageRef.current?.scrollTo({ y: partsY.current, animated: true })}
                        accessibilityRole="button"
                        accessibilityLabel={t("babyDev.jumpToParts")}
                      >
                        <Feather name="chevron-right" size={16} color={Theme.colors.inkSoft} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.bigText}>{data.big.text}</Text>
                  </View>
                </View>
                <View style={styles.why}>
                  <Text style={styles.whyHead}>{t("babyDev.whyMatters")}</Text>
                  <Text style={styles.whyText}>{data.big.why}</Text>
                </View>
              </View>

              <View style={styles.highlights}>
                {data.highlights.map((highlight) => (
                  <View key={highlight} style={styles.highlight}>
                    <View style={styles.tick}>
                      <LineIcon size={12} color={Theme.colors.magenta}>
                        <Path d="M5 12.5l4.5 4.5L19 7.5" />
                      </LineIcon>
                    </View>
                    <Text style={styles.highlightText}>{highlight}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionHead} onLayout={(event) => (partsY.current = event.nativeEvent.layout.y)}>
                {t("babyDev.parts")}
              </Text>
              <View style={styles.parts}>
                {data.parts.map((part, index) => {
                  const open = index === openPart;
                  const accent = PART_STYLE[part.key];
                  return (
                    <View key={part.key} style={index > 0 && styles.partDivider}>
                      <TouchableOpacity
                        style={styles.partRow}
                        onPress={() => setOpenPart(open ? -1 : index)}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: open }}
                      >
                        <View style={[styles.partDot, { backgroundColor: accent.color }]} />
                        <LineIcon size={20} color={accent.color}>
                          {accent.icon}
                        </LineIcon>
                        <Text style={styles.partTitle}>{t(`babyDev.part_${part.key}`)}</Text>
                        <Feather
                          name="chevron-right"
                          size={16}
                          color={Theme.colors.inkSoft}
                          style={open && styles.chevOpen}
                        />
                      </TouchableOpacity>
                      {open && (
                        <View style={styles.partPanel}>
                          <Text style={styles.partText}>{part.text}</Text>
                          {part.dyk && (
                            <Text style={[styles.dyk, { backgroundColor: accent.tint }]}>
                              <Text style={[styles.dykHead, { color: accent.color }]}>{t("babyDev.didYouKnow")} </Text>
                              {part.dyk}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              <View style={[styles.card, styles.noteCard]}>
                <View style={styles.badgeIcon}>
                  <LineIcon size={20} color={Theme.colors.magenta}>
                    <Path d="M7 3h8l4 4v14H7z" />
                    <Path d="M15 3v4h4M10 12h6M10 16h6" />
                  </LineIcon>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.cardHead}>{t("babyDev.notice")}</Text>
                  <View style={styles.noticeList}>
                    {data.notice.map((item) => (
                      <View key={item} style={styles.noticeItem}>
                        <View style={styles.noticeDot} />
                        <Text style={styles.noticeText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={[styles.card, styles.tipCard]}>
                <View style={[styles.badgeIcon, styles.tipIcon]}>
                  <LineIcon size={20} color={Theme.colors.magenta}>
                    <Path d="M12 21v-9" />
                    <Path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6Z" />
                    <Path d="M12 14c0-3 2.5-5 6-5 0 3-2.5 5-6 5Z" />
                  </LineIcon>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.cardHead}>{t("babyDev.tip")}</Text>
                  <Text style={styles.tipText}>{data.tip}</Text>
                </View>
              </View>

              <View style={styles.info}>
                <Feather name="info" size={14} color={Theme.colors.inkSoft} style={styles.infoIcon} />
                <Text style={styles.infoText}>{t("babyDev.disclaimer")}</Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: Theme.spacing.xl,
  },
  title: {
    marginHorizontal: SIDE,
    fontFamily: Theme.typography.display,
    fontSize: 29,
    lineHeight: 33,
    letterSpacing: -0.5,
    color: Theme.colors.ink,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginHorizontal: SIDE,
  },
  sub: {
    fontFamily: Theme.typography.subheading,
    fontSize: 12.5,
    color: Theme.colors.inkSoft,
  },
  weeks: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginHorizontal: 6,
  },
  chev: {
    width: 28,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  strip: {
    flex: 1,
  },
  stripContent: {
    gap: CHIP_GAP,
    alignItems: "center",
  },
  chip: {
    width: CHIP,
    height: 34,
    marginVertical: 5,
    borderRadius: 10,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: {
    backgroundColor: Theme.colors.magenta,
  },
  chipText: {
    fontFamily: Theme.typography.subheading,
    fontSize: 13.5,
    color: Theme.colors.inkSoft,
  },
  chipTextOn: {
    color: Theme.colors.surface,
  },
  seg: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
    marginHorizontal: SIDE,
    padding: 3,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
  },
  segButton: {
    flex: 1,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: Theme.borderRadius.md,
  },
  segButtonOn: {
    backgroundColor: Theme.colors.magentaTint,
  },
  segText: {
    fontFamily: Theme.typography.heading,
    fontSize: 12.5,
  },
  hero: {
    marginTop: 14,
    marginHorizontal: SIDE,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.magentaWash,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    position: "absolute",
    top: 0,
    resizeMode: "contain",
  },
  heroBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
    backgroundColor: Theme.home.heroTagBg,
    fontFamily: Theme.typography.subheading,
    fontSize: 10,
    color: Theme.colors.inkSoft,
  },
  fruit: {
    aspectRatio: 544 / 512,
    resizeMode: "contain",
  },
  heroLine: {
    marginTop: 12,
    marginHorizontal: SIDE,
    fontFamily: Theme.typography.heading,
    fontSize: 17,
    lineHeight: 21,
    color: Theme.colors.ink,
  },
  muted: {
    marginTop: 3,
    marginHorizontal: SIDE,
    fontFamily: Theme.typography.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: Theme.colors.inkSoft,
  },
  stats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginHorizontal: SIDE,
  },
  stat: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surface,
  },
  statLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11,
    color: Theme.colors.inkSoft,
  },
  statValue: {
    marginTop: 4,
    fontFamily: Theme.typography.heading,
    fontSize: 24,
    color: Theme.colors.ink,
  },
  statUnit: {
    fontFamily: Theme.typography.caption,
    fontSize: 12.5,
    color: Theme.colors.inkSoft,
  },
  compareNote: {
    gap: 2,
    marginTop: 12,
    marginHorizontal: SIDE,
  },
  compareNoteText: {
    textAlign: "center",
    fontFamily: Theme.typography.body,
    fontSize: 10.5,
    lineHeight: 16,
    color: Theme.colors.inkSoft,
  },
  big: {
    marginTop: 14,
    marginHorizontal: SIDE,
    padding: 14,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.magentaWash,
  },
  bigTop: {
    flexDirection: "row",
    gap: 12,
  },
  bigIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  bigEmoji: {
    fontSize: 20,
  },
  eyebrow: {
    fontFamily: Theme.typography.heading,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Theme.colors.magenta,
  },
  bigRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 2,
  },
  bigHead: {
    flex: 1,
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    lineHeight: 19,
    color: Theme.colors.ink,
  },
  go: {
    width: 44,
    height: 44,
    marginTop: -12,
    marginRight: -14,
    marginBottom: -10,
    alignItems: "center",
    justifyContent: "center",
  },
  bigText: {
    marginTop: 2,
    fontFamily: Theme.typography.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: Theme.colors.inkSoft,
  },
  why: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairline,
  },
  whyHead: {
    fontFamily: Theme.typography.heading,
    fontSize: 12.5,
    color: Theme.colors.magenta,
  },
  whyText: {
    fontFamily: Theme.typography.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: Theme.colors.inkSoft,
  },
  highlights: {
    gap: 6,
    marginTop: 10,
    marginHorizontal: SIDE,
  },
  highlight: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surfaceSunken,
  },
  tick: {
    width: 18,
    height: 18,
    marginTop: 1,
    borderRadius: 9,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightText: {
    flex: 1,
    fontFamily: Theme.typography.body,
    fontSize: 12.5,
    lineHeight: 17.5,
    color: Theme.colors.ink,
  },
  sectionHead: {
    marginTop: 22,
    marginBottom: 8,
    marginHorizontal: SIDE,
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.ink,
  },
  parts: {
    marginHorizontal: SIDE,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.surface,
    overflow: "hidden",
  },
  partDivider: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairline,
  },
  partRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  partDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  partTitle: {
    flex: 1,
    fontFamily: Theme.typography.caption,
    fontSize: 13.5,
    color: Theme.colors.ink,
  },
  chevOpen: {
    transform: [{ rotate: "90deg" }],
  },
  partPanel: {
    paddingLeft: 31,
    paddingRight: 14,
    paddingBottom: 14,
  },
  partText: {
    fontFamily: Theme.typography.body,
    fontSize: 13,
    lineHeight: 20,
    color: Theme.colors.inkSoft,
  },
  dyk: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.md,
    overflow: "hidden",
    fontFamily: Theme.typography.body,
    fontSize: 12,
    lineHeight: 17,
    color: Theme.colors.ink,
  },
  dykHead: {
    fontFamily: Theme.typography.heading,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 12,
    marginHorizontal: SIDE,
    padding: 14,
    borderRadius: Theme.borderRadius.lg,
  },
  noteCard: {
    backgroundColor: Theme.colors.magentaWash,
  },
  tipCard: {
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    backgroundColor: Theme.colors.surface,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tipIcon: {
    backgroundColor: Theme.colors.magentaTint,
  },
  cardHead: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.ink,
  },
  noticeList: {
    marginTop: 6,
  },
  noticeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 2,
  },
  noticeDot: {
    width: 5,
    height: 5,
    marginTop: 7,
    borderRadius: 3,
    backgroundColor: Theme.colors.magenta,
  },
  noticeText: {
    flex: 1,
    fontFamily: Theme.typography.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Theme.colors.inkSoft,
  },
  tipText: {
    marginTop: 3,
    fontFamily: Theme.typography.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Theme.colors.inkSoft,
  },
  info: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 16,
    marginHorizontal: SIDE,
  },
  infoIcon: {
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontFamily: Theme.typography.body,
    fontSize: 10.5,
    lineHeight: 16,
    color: Theme.colors.inkSoft,
  },
});
