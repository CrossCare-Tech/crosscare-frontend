import React, { useState } from "react";
import { Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ResizeMode, Video } from "expo-av";
import * as WebBrowser from "expo-web-browser";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { ReplyMedia as Media, formatDuration, imageSource } from "@/constants/replyMedia";

type Props = {
  items: Media[];
  onSave: (title: string) => Promise<void> | void;
  onRemind: (title: string) => Promise<boolean> | boolean; // false when it could not be set
  onUndoRemind?: (title: string) => void;
};

// Image, video, link card and follow-up buttons shown under a reply. Rules from the prototype:
// every link shows its domain and asks before leaving the app, images have captions and alt text,
// and video never starts by itself.
export default function ReplyMedia({ items, onSave, onRemind, onUndoRemind }: Props) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState<Extract<Media, { type: "image" }> | null>(null);
  const [saved, setSaved] = useState(false);
  const [reminded, setReminded] = useState(false);

  const openLink = (link: Extract<Media, { type: "link" }>) =>
    Alert.alert(t("replyMedia.openTitle"), t("replyMedia.openMessage", { domain: link.domain }), [
      { text: t("replyMedia.stay"), style: "cancel" },
      { text: t("replyMedia.open"), onPress: () => WebBrowser.openBrowserAsync(link.url) },
    ]);

  return (
    <View style={styles.wrap}>
      {items.map((media, index) => {
        if (media.type === "image") {
          const source = imageSource(media);
          if (!source) return null;
          return (
            <View key={index} style={styles.card}>
              <TouchableOpacity
                onPress={() => setZoom(media)}
                accessibilityRole="imagebutton"
                accessibilityLabel={`${media.alt}. ${t("replyMedia.enlarge")}`}
              >
                <Image source={source} style={styles.image} accessibilityLabel={media.alt} />
                <View style={styles.expand}>
                  <Feather name="maximize-2" size={14} color={Theme.colors.ink} />
                </View>
              </TouchableOpacity>
              <View style={styles.caption}>
                <Text style={styles.captionTitle}>{media.title}</Text>
                <Text style={styles.captionNote}>{media.note}</Text>
              </View>
            </View>
          );
        }

        if (media.type === "video") {
          return (
            <View key={index} style={styles.card}>
              <Video
                style={styles.video}
                source={{ uri: media.url }}
                posterSource={media.posterUrl ? { uri: media.posterUrl } : undefined}
                usePoster={!!media.posterUrl}
                useNativeControls
                shouldPlay={false}
                resizeMode={ResizeMode.CONTAIN}
                accessibilityLabel={media.title}
              />
              <View style={styles.caption}>
                <Text style={styles.captionTitle}>{media.title}</Text>
                <Text style={styles.captionNote}>
                  {t("replyMedia.video")} · {formatDuration(media.durationSec)}
                </Text>
              </View>
            </View>
          );
        }

        if (media.type === "link") {
          return (
            <TouchableOpacity
              key={index}
              style={styles.link}
              onPress={() => openLink(media)}
              accessibilityRole="link"
              accessibilityLabel={`${media.title}, ${media.domain}`}
            >
              <View style={styles.favicon}>
                <Ionicons name="shield-checkmark-outline" size={16} color={Theme.colors.teal} />
              </View>
              <View style={styles.linkText}>
                <Text style={styles.captionTitle} numberOfLines={2}>
                  {media.title}
                </Text>
                <Text style={styles.linkDomain}>
                  {media.domain} · {media.label}
                </Text>
              </View>
              <Feather name="arrow-up-right" size={16} color={Theme.colors.inkFaint} />
            </TouchableOpacity>
          );
        }

        return (
          <View key={index} style={styles.actions}>
            {media.actions.includes("save") && (
              <TouchableOpacity
                style={[styles.action, saved && styles.actionOn]}
                onPress={async () => {
                  if (saved) return;
                  await onSave(media.title);
                  setSaved(true);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: saved }}
              >
                <Feather name="bookmark" size={14} color={saved ? Theme.colors.surface : Theme.colors.purple} />
                <Text style={[styles.actionText, saved && styles.actionTextOn]}>
                  {saved ? t("replyMedia.savedToJournal") : t("replyMedia.saveToJournal")}
                </Text>
              </TouchableOpacity>
            )}
            {media.actions.includes("remind") && (
              <TouchableOpacity
                style={[styles.action, reminded && styles.actionOn]}
                onPress={async () => {
                  if (reminded) {
                    onUndoRemind?.(media.title);
                    setReminded(false);
                    return;
                  }
                  setReminded(await onRemind(media.title));
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: reminded }}
              >
                <Feather name="clock" size={14} color={reminded ? Theme.colors.surface : Theme.colors.purple} />
                <Text style={[styles.actionText, reminded && styles.actionTextOn]}>
                  {reminded ? t("replyMedia.reminderSet") : t("replyMedia.remindMe")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <Modal visible={!!zoom} transparent animationType="fade" onRequestClose={() => setZoom(null)}>
        <View style={styles.viewer}>
          <TouchableOpacity
            style={styles.close}
            onPress={() => setZoom(null)}
            accessibilityRole="button"
            accessibilityLabel={t("replyMedia.close")}
          >
            <Text style={styles.closeText}>{t("replyMedia.close")}</Text>
          </TouchableOpacity>
          {zoom && (
            <>
              <Image source={imageSource(zoom)!} style={styles.viewerImage} resizeMode="contain" accessibilityLabel={zoom.alt} />
              <Text style={styles.viewerCaption}>
                {zoom.title} · {zoom.note}
              </Text>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 8 },
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    overflow: "hidden",
  },
  image: { width: "100%", height: 170 },
  expand: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.tagOnPhoto,
    alignItems: "center",
    justifyContent: "center",
  },
  video: { width: "100%", height: 180, backgroundColor: Theme.colors.plum },
  caption: { padding: 10, gap: 2 },
  captionTitle: { fontFamily: Theme.typography.heading, fontSize: 13, color: Theme.colors.ink },
  captionNote: { fontFamily: Theme.typography.caption, fontSize: 11, color: Theme.colors.inkFaint },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.md,
    padding: 10,
  },
  favicon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.tealTint,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: { flex: 1, gap: 2 },
  linkDomain: { fontFamily: Theme.typography.caption, fontSize: 11, color: Theme.colors.teal },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionOn: { backgroundColor: Theme.colors.purple, borderColor: Theme.colors.purple },
  actionText: { fontFamily: Theme.typography.heading, fontSize: 12, color: Theme.colors.purple },
  actionTextOn: { color: Theme.colors.surface },
  viewer: {
    flex: 1,
    backgroundColor: Theme.colors.photoShade,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 14,
  },
  viewerImage: { width: "100%", height: "60%", borderRadius: Theme.borderRadius.lg },
  viewerCaption: { fontFamily: Theme.typography.caption, fontSize: 12, color: Theme.colors.surface, textAlign: "center" },
  close: {
    position: "absolute",
    top: 54,
    right: 16,
    backgroundColor: Theme.colors.tagOnPhoto,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeText: { fontFamily: Theme.typography.heading, fontSize: 12, color: Theme.colors.ink },
});
