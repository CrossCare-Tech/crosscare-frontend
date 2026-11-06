import React from "react";
import { hasPremiumAccess, usePremiumStatus } from "@/zustandStore/premiumStore";
import PremiumLocked from "@/components/premium/PremiumLocked";

// Every AI Concierge screen is a Premium feature: without access, the patient sees why instead of the screen
export function withPremiumGate<P extends object>(Screen: React.ComponentType<P>) {
  const Gated = (props: P) => {
    const status = usePremiumStatus();
    return hasPremiumAccess(status) ? <Screen {...props} /> : <PremiumLocked />;
  };
  Gated.displayName = `withPremiumGate(${Screen.displayName || Screen.name || "Screen"})`;
  return Gated;
}
