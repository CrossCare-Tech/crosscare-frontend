import React, { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import { CONFIG } from "@/constants/config";
import { Theme } from "@/constants/theme";
import LineIcon from "@/components/profile/LineIcon";
import { Pill, Tone } from "./VitalsUI";

// One layout for every metric screen (Health prototype 5.1–5.5): latest value, period chart,
// plain-language guide, recent readings and "Add reading" in the thumb zone.

export type Period = "7" | "30" | "90";

const pad = (n: number) => String(n).padStart(2, "0");
export const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

// Range of a period and the position (0 = first day, 1 = today) of a date inside it
export const periodWindow = (period: Period) => {
  const days = Number(period);
  const start = fmtDate(daysAgo(days - 1));
  const end = fmtDate(daysAgo(0));
  const startTime = new Date(`${start}T12:00:00`).getTime();
  const span = (days - 1) * 86400000;
  return {
    days,
    contains: (date: string) => date >= start && date <= end,
    x: (date: string) => (new Date(`${date}T12:00:00`).getTime() - startTime) / span,
  };
};

// Seven weekday labels for a week, five dates for longer periods
export const periodAxis = (period: Period, language: string) => {
  const days = Number(period);
  return days === 7
    ? Array.from({ length: 7 }, (_, index) => daysAgo(6 - index).toLocaleDateString(language, { weekday: "short" }))
    : Array.from({ length: 5 }, (_, index) =>
        daysAgo(Math.round(((days - 1) * (4 - index)) / 4)).toLocaleDateString(language, {
          month: "short",
          day: "numeric",
        })
      );
};

// Daily activity list (`GET /user/activity/:id`): one merged entry per day, all history
export const useActivityHistory = () => {
  const user = useSelector((state: any) => state.user);
  const [activities, setActivities] = useState<{ date: string; details: any }[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!user?.user_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/user/activity/${user.user_id}`, {
        headers: {
          Accept: "application/json",
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch activities (${response.status})`);
      }
      const result = await response.json();
      setActivities(result?.activities || []);
    } catch (error) {
      console.warn("Error fetching activity history:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [user?.user_id, user?.token])
  );

  return { activities, loading, reload };
};

// Text with **bold** parts, as in the prototype guides
const RichText = ({ text, style, boldStyle }: { text: string; style: any; boldStyle: any }) => (
  <Text style={style}>
    {text.split("**").map((part, index) =>
      index % 2 === 1 ? (
        <Text key={index} style={boldStyle}>
          {part}
        </Text>
      ) : (
        part
      )
    )}
  </Text>
);

export const MetricHero = ({
  when,
  value,
  unit,
  pill,
  source,
  manual,
}: {
  when: string;
  value: string;
  unit: string;
  pill: { label: string; tone: Tone };
  source: string;
  manual: boolean;
}) => (
  <View style={[styles.card, styles.hero]}>
    <Text style={styles.when}>{when}</Text>
    <Text style={styles.big}>
      {value}
      <Text style={styles.unit}> {unit}</Text>
    </Text>
    <View style={styles.pillRow}>
      <Pill label={pill.label} tone={pill.tone} />
    </View>
    <View style={styles.source}>
      {manual ? (
        <Feather name="edit-3" size={14} color={Theme.colors.teal} />
      ) : (
        <LineIcon size={14} color={Theme.colors.teal}>
          <Path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5" />
        </LineIcon>
      )}
      <Text style={styles.sourceText}>{source}</Text>
    </View>
  </View>
);

export const MetricEmpty = ({ text }: { text: string }) => (
  <View style={[styles.card, styles.hero]}>
    <Text style={styles.empty}>{text}</Text>
  </View>
);

// Health prototype `.hl-seg`
export const Segmented = ({
  options,
  value,
  onChange,
}: {
  options: { id: Period; label: string }[];
  value: Period;
  onChange: (id: Period) => void;
}) => (
  <View style={styles.seg} accessibilityRole="tablist">
    {options.map((option) => {
      const selected = option.id === value;
      return (
        <TouchableOpacity
          key={option.id}
          style={[styles.segItem, selected && styles.segItemOn]}
          onPress={() => onChange(option.id)}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
        >
          <Text style={[styles.segText, selected && styles.segTextOn]}>{option.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const W = 262;
const H = 120;
const PAD = 12;
const scale = (min: number, max: number) => (value: number) => PAD + (H - 2 * PAD) * (1 - (value - min) / (max - min));
const px = (x: number) => 8 + (W - 16) * x;

const Band = ({ band, y }: { band?: [number, number]; y: (value: number) => number }) =>
  band ? <Rect x={0} y={y(band[1])} width={W} height={y(band[0]) - y(band[1])} rx={8} fill={Theme.colors.successTint} /> : null;

// Health prototype `lineChart`: smooth line over a "normal" band, last point ringed
export const TrendChart = ({
  points,
  min,
  max,
  band,
}: {
  points: { x: number; value: number }[];
  min: number;
  max: number;
  band?: [number, number];
}) => {
  const y = scale(min, max);
  const coords = points.map((point) => [px(point.x), y(point.value)]);

  let line = "";
  coords.forEach(([x, cy], index) => {
    if (index === 0) {
      line = `M${x} ${cy}`;
      return;
    }
    const [prevX, prevY] = coords[index - 1];
    const midX = (prevX + x) / 2;
    line += ` C${midX} ${prevY} ${midX} ${cy} ${x} ${cy}`;
  });
  const last = coords[coords.length - 1];

  return (
    <Svg style={styles.chart} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <SvgGradient id="trend" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={Theme.colors.purple} stopOpacity={0.18} />
          <Stop offset="1" stopColor={Theme.colors.purple} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Band band={band} y={y} />
      {coords.length > 1 && (
        <>
          <Path d={`${line} L${last[0]} ${H - PAD} L${coords[0][0]} ${H - PAD}Z`} fill="url(#trend)" />
          <Path d={line} fill="none" stroke={Theme.colors.purple} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
      {last && (
        <Circle cx={last[0]} cy={last[1]} r={6} fill={Theme.colors.surface} stroke={Theme.colors.purple} strokeWidth={3} />
      )}
    </Svg>
  );
};

// Health prototype `barsChart`: one floating bar per day (top and bottom number), latest in purple
export const RangeBarsChart = ({
  bars,
  min,
  max,
  band,
  barWidth,
}: {
  bars: { x: number; high: number; low: number }[];
  min: number;
  max: number;
  band?: [number, number];
  barWidth: number;
}) => {
  const y = scale(min, max);
  return (
    <Svg style={styles.chart} viewBox={`0 0 ${W} ${H}`}>
      <Band band={band} y={y} />
      {bars.map((bar, index) => (
        <Rect
          key={index}
          x={px(bar.x) - barWidth / 2}
          y={y(bar.high)}
          width={barWidth}
          height={Math.max(y(bar.low) - y(bar.high), barWidth)}
          rx={barWidth / 2}
          fill={index === bars.length - 1 ? Theme.colors.purple : Theme.colors.purpleSoft}
        />
      ))}
    </Svg>
  );
};

export type LegendMark = "line" | "earlier" | "band";

export const ChartCard = ({
  axis,
  legend,
  children,
}: {
  axis: string[];
  legend: { mark: LegendMark; label: string }[];
  children: React.ReactNode;
}) => (
  <View style={[styles.card, styles.chartCard]}>
    {children}
    <View style={styles.axis}>
      {axis.map((label, index) => (
        <Text key={index} style={[styles.axisText, index === axis.length - 1 && styles.axisToday]}>
          {label}
        </Text>
      ))}
    </View>
    <View style={styles.legend}>
      {legend.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View
            style={
              item.mark === "band" ? styles.legendBand : [styles.legendDot, item.mark === "earlier" && styles.legendEarlier]
            }
          />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  </View>
);

export const GuideNote = ({ text }: { text: string }) => (
  <View style={styles.guide}>
    <Feather name="info" size={18} color={Theme.colors.teal} style={styles.guideIcon} />
    <RichText text={text} style={styles.guideText} boldStyle={styles.guideBold} />
  </View>
);

export const SectionLabel = ({ children }: { children: string }) => <Text style={styles.label}>{children}</Text>;

export const ReadingList = ({
  items,
}: {
  items: { key: string; value: string; when: string; pill: { label: string; tone: Tone } }[];
}) => (
  <View style={[styles.card, styles.list]}>
    {items.map((item, index) => (
      <View key={item.key} style={[styles.reading, index > 0 && styles.divider]}>
        <View style={styles.readingText}>
          <Text style={styles.readingValue}>{item.value}</Text>
          <Text style={styles.readingWhen}>{item.when}</Text>
        </View>
        <Pill label={item.pill.label} tone={item.pill.tone} />
      </View>
    ))}
  </View>
);

// Health prototype 5.5 `.hl-urgent`, in the app palette: plum card, white triangle on a magenta disc, one primary action
export const UrgentAlert = ({
  title,
  body,
  primary,
  secondary,
  onDismiss,
  dismissLabel,
}: {
  title: string;
  body: string;
  primary: { label: string; onPress: () => void };
  secondary: { label: string; onPress: () => void };
  onDismiss: () => void;
  dismissLabel: string;
}) => (
  <View style={styles.urgent} accessibilityRole="alert">
    <View style={styles.urgentTop}>
      <View style={styles.disc}>
        <Feather name="alert-triangle" size={20} color={Theme.colors.surface} />
      </View>
      <Text style={styles.urgentTitle}>{title}</Text>
      <TouchableOpacity
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={dismissLabel}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Feather name="x" size={20} color={Theme.colors.onInkSoft} />
      </TouchableOpacity>
    </View>
    <Text style={styles.urgentBody}>{body}</Text>
    <TouchableOpacity style={[styles.urgentButton, styles.urgentPrimary]} onPress={primary.onPress} accessibilityRole="button">
      <Text style={styles.urgentPrimaryText}>{primary.label}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.urgentButton, styles.urgentLine]} onPress={secondary.onPress} accessibilityRole="button">
      <Text style={styles.urgentLineText}>{secondary.label}</Text>
    </TouchableOpacity>
  </View>
);

// Shortcut to the reminders screen, preset to one reminder type
export const ReminderCard = ({ title, hint, onPress }: { title: string; hint: string; onPress: () => void }) => (
  <TouchableOpacity style={[styles.card, styles.list, styles.reading]} onPress={onPress} accessibilityRole="button">
    <View style={styles.iconChip}>
      <Feather name="bell" size={18} color={Theme.colors.purple} />
    </View>
    <View style={styles.readingText}>
      <Text style={styles.readingValue}>{title}</Text>
      <Text style={styles.readingWhen}>{hint}</Text>
    </View>
    <Feather name="chevron-right" size={18} color={Theme.colors.inkFaint} />
  </TouchableOpacity>
);

// "Add reading", pinned below the scroll so it stays in the thumb zone
export const AddReadingButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <View style={styles.foot}>
    <TouchableOpacity style={styles.button} onPress={onPress} accessibilityRole="button">
      <Feather name="plus" size={18} color={Theme.colors.surface} />
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  </View>
);

export const metricStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: Theme.spacing.lg,
    gap: 14,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.card,
  },
  hero: {
    padding: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  when: {
    fontFamily: Theme.typography.heading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  big: {
    fontFamily: Theme.typography.display,
    fontSize: 40,
    lineHeight: 46,
    color: Theme.colors.ink,
  },
  unit: {
    fontFamily: Theme.typography.subheading,
    fontSize: 14,
    color: Theme.colors.inkSoft,
  },
  pillRow: {
    flexDirection: "row",
  },
  source: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairline,
  },
  sourceText: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11.5,
    color: Theme.colors.inkSoft,
  },
  empty: {
    fontFamily: Theme.typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: Theme.colors.inkFaint,
    textAlign: "center",
    paddingVertical: Theme.spacing.sm,
  },
  seg: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surfaceSunken,
  },
  segItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    borderRadius: Theme.borderRadius.sm,
  },
  segItemOn: {
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.soft,
  },
  segText: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.inkSoft,
  },
  segTextOn: {
    color: Theme.colors.purple,
  },
  chart: {
    width: "100%",
    aspectRatio: W / H,
  },
  chartCard: {
    padding: Theme.spacing.md,
  },
  axis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Theme.spacing.sm,
  },
  axisText: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11,
    color: Theme.colors.inkFaint,
  },
  axisToday: {
    fontFamily: Theme.typography.heading,
    color: Theme.colors.purple,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: Theme.spacing.md,
    rowGap: Theme.spacing.xs,
    paddingTop: Theme.spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.purple,
  },
  legendEarlier: {
    backgroundColor: Theme.colors.purpleSoft,
  },
  legendBand: {
    width: 8,
    height: 8,
    borderRadius: 3,
    backgroundColor: Theme.colors.successTint,
    borderWidth: 1.5,
    borderColor: Theme.colors.success,
  },
  legendText: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11,
    color: Theme.colors.inkSoft,
  },
  guide: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.tealTint,
  },
  guideIcon: {
    marginTop: 1,
  },
  guideText: {
    flex: 1,
    fontFamily: Theme.typography.body,
    fontSize: 13,
    lineHeight: 19.5,
    color: Theme.home.dayInfoText,
  },
  guideBold: {
    fontFamily: Theme.typography.heading,
    color: Theme.colors.ink,
  },
  label: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.inkSoft,
    paddingHorizontal: Theme.spacing.xs,
    marginTop: Theme.spacing.xs,
  },
  list: {
    paddingHorizontal: Theme.spacing.md,
  },
  reading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 58,
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.hairlineLight,
  },
  readingText: {
    flex: 1,
    gap: 2,
  },
  readingValue: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.ink,
  },
  readingWhen: {
    fontFamily: Theme.typography.subheading,
    fontSize: 11.5,
    color: Theme.colors.inkFaint,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  urgent: {
    backgroundColor: Theme.colors.plum,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    gap: 12,
    ...Theme.shadows.card,
  },
  urgentTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  disc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.magentaVivid,
    alignItems: "center",
    justifyContent: "center",
  },
  urgentTitle: {
    flex: 1,
    fontFamily: Theme.typography.display,
    fontSize: 16,
    lineHeight: 20,
    color: Theme.colors.surface,
  },
  urgentBody: {
    fontFamily: Theme.typography.body,
    fontSize: 13,
    lineHeight: 19.5,
    color: Theme.colors.onInkSoft,
  },
  urgentButton: {
    minHeight: 46,
    borderRadius: Theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  urgentPrimary: {
    backgroundColor: Theme.colors.magentaVivid,
  },
  urgentPrimaryText: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.surface,
  },
  urgentLine: {
    borderWidth: 1.5,
    borderColor: Theme.colors.onInkLine,
  },
  urgentLineText: {
    fontFamily: Theme.typography.heading,
    fontSize: 13.5,
    color: Theme.colors.surface,
  },
  foot: {
    paddingHorizontal: 22,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.md,
  },
  button: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.magenta,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: Theme.typography.heading,
    fontSize: 15,
    color: Theme.colors.surface,
  },
});
