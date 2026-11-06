// Settings of the on-device portrait cache (components/ui/AvatarImage.tsx). Kept free of imports so tests can load it.

// Bump when the portraits in the bucket change, so devices drop their downloaded copies.
export const AVATAR_CACHE_VERSION = 1;

// A real portrait is tens of KB; anything smaller is an error body saved by mistake.
export const AVATAR_MIN_BYTES = 5000;
