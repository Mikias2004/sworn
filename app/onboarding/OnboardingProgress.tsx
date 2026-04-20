"use client";

import { usePathname } from "next/navigation";

const steps = [
  "/onboarding/goal",
  "/onboarding/frequency",
  "/onboarding/connect",
  "/onboarding/stake",
  "/onboarding/payment",
];

export default function OnboardingProgress() {
  const pathname = usePathname();

  // No progress bar on confirmation screen
  if (pathname === "/onboarding/confirm") return null;

  const currentStep = steps.findIndex((s) => pathname.startsWith(s));
  if (currentStep === -1) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "0 24px 12px",
      }}
    >
      {steps.map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 99,
            background: i <= currentStep ? "var(--text-primary)" : "var(--border-md)",
            transition: "background 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}
