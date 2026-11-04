import React, { useEffect, useState } from "react";
import { Image, ImageProps, ImageSourcePropType, StyleProp, View, ViewStyle } from "react-native";
import * as FileSystem from "expo-file-system";
import { AVATAR_CACHE_VERSION } from "@/constants/avatarImages";
import { GUIDE } from "@/constants/conciergeGuide";

// Remote avatar portraits are downloaded once into the app's document folder and read from there afterwards,
// so a portrait seen once keeps showing offline (the document folder is not cleared with "Clear cache").
const DIR = `${FileSystem.documentDirectory}avatars-v${AVATAR_CACHE_VERSION}/`;
const fileFor = (uri: string) => DIR + uri.split("/").slice(-2).join("_");
const inflight = new Map<string, Promise<string>>();

// Resolves to the local file of a remote portrait, downloading it the first time.
const cached = (uri: string): Promise<string> => {
  const path = fileFor(uri);
  let job = inflight.get(path);
  if (!job) {
    job = (async () => {
      if ((await FileSystem.getInfoAsync(path)).exists) return path;
      await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
      // Download to a temp name so an interrupted download is never mistaken for a cached portrait
      await FileSystem.downloadAsync(uri, `${path}.part`);
      await FileSystem.moveAsync({ from: `${path}.part`, to: path });
      return path;
    })().finally(() => inflight.delete(path));
    inflight.set(path, job);
  }
  return job;
};

interface Props extends ImageProps {
  // Shown when the portrait cannot be downloaded and is not cached yet. null leaves the space empty.
  fallback?: ImageSourcePropType | null;
}

// Drop-in replacement of Image for the Concierge portraits.
export default function AvatarImage({ source, fallback = GUIDE.portrait, ...rest }: Props) {
  const remote = typeof source === "object" && !Array.isArray(source) && "uri" in source && source.uri ? source.uri : null;
  const [local, setLocal] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLocal(null);
    setFailed(false);
    if (!remote) return;
    let live = true;
    cached(remote)
      .then((path) => live && setLocal(path))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [remote]);

  // Bundled sources (require) need no download
  if (!remote) return <Image {...rest} source={source} />;
  if (local) return <Image {...rest} source={{ uri: local }} onError={() => setFailed(true)} />;
  if (failed && fallback) return <Image {...rest} source={fallback} />;
  // Still downloading (or failed with no fallback): keep the space so the layout does not jump
  return <View style={rest.style as StyleProp<ViewStyle>} accessibilityLabel={rest.accessibilityLabel} />;
}
