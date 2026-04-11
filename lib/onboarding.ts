export type OnboardingState = {
  raw: string;
  title: string;
  confirmation: string;
  goalType: "fitness" | "productivity" | "learning" | "health" | "other";
  suggestedFrequency: "daily" | "3x_week" | "4x_week" | "custom";
  suggestedApp: string | null;
  frequency: string;
  pledgeAmount: number;
  trackingApp: string | null; // chosen app, or null = manual
};

const KEY = "sworn_onboarding";

export function getOnboarding(): Partial<OnboardingState> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function setOnboarding(data: Partial<OnboardingState>) {
  if (typeof window === "undefined") return;
  const current = getOnboarding();
  sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...data }));
}

export function clearOnboarding() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

export function getStartDate(frequency: string): Date {
  const now = new Date();
  if (frequency === "daily") {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return tomorrow;
  }
  // Weekly → next Monday
  const d = new Date(now);
  const day = d.getDay(); // 0=Sun, 1=Mon
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  return d;
}

export function formatStartDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function closingLine(goalType: string): string {
  switch (goalType) {
    case "fitness":
      return "Don't skip leg day.";
    case "productivity":
      return "No more procrastinating.";
    case "learning":
      return "Consistency beats intensity.";
    case "health":
      return "Your future self will thank you.";
    default:
      return "Keep your word.";
  }
}
