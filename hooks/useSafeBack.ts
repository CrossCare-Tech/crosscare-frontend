import { useCallback } from "react";
import { useRouter } from "expo-router";

// Back that always goes somewhere: a screen opened by a link or after a replace has nothing to pop,
// and a plain router.back() then does nothing.
export const useSafeBack = (fallback: string = "/patient/(tabs)/home") => {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as any);
  }, [router, fallback]);
};
