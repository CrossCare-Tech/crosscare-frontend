import { useEffect, useState } from "react";
import { AudioState, replyAudio } from "@/utils/replyAudio";

// The state of one reply's player: "idle" unless this reply is the one being read.
export function useReplyAudio(messageId: string): AudioState {
  const [state, setState] = useState(replyAudio.getState());
  useEffect(() => replyAudio.subscribe(setState), []);
  return state.messageId === messageId ? state : { ...state, messageId, status: "idle", positionMs: 0, engine: null };
}
