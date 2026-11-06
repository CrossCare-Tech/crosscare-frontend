import { supabase } from "@/supabase/supabase";

// The avatar portraits are not in the repo: they live in a public Supabase Storage bucket, one file per look.
// Path: <bucket>/<guide>/h<hair>-o<outfit>-t<tone>.jpg  (e.g. concierge-avatars/amara/h3-o2-t2.jpg), 640px.
export const AVATAR_BUCKET = "concierge-avatars";

// EXPO_PUBLIC_AVATAR_BASE_URL overrides the bucket (a local server while testing, or a CDN in front of it).
const BASE = process.env.EXPO_PUBLIC_AVATAR_BASE_URL;

export const avatarUrl = (key: string) =>
  BASE ? `${BASE}/${key}.jpg` : supabase.storage.from(AVATAR_BUCKET).getPublicUrl(`${key}.jpg`).data.publicUrl;
