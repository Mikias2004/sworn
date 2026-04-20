export type AppInfo = {
  name: string;
  slug: string;
  letter: string;
  bg: string;
  color: string;
  border?: string;
  /** Simple Icons CDN slug — https://cdn.simpleicons.org/[iconSlug]/[iconColor] */
  iconSlug: string;
  /** Brand hex color (no #) used to tint the Simple Icons SVG on a light background */
  iconColor: string;
  activity: string;
  metricLabel: string;
  permission2: string;
  permission3: string;
  goalTypes: Array<"fitness" | "productivity" | "learning" | "health" | "other" | "all">;
};

export const ALL_APPS: AppInfo[] = [
  {
    name: "Strava",
    slug: "strava",
    letter: "S",
    bg: "#FC4C02",
    color: "#fff",
    iconSlug: "strava",
    iconColor: "FC4C02",
    activity: "runs, rides, and swims",
    metricLabel: "distance and duration",
    permission2: "Verify pace, distance, and duration",
    permission3: "Check activities against your goal",
    goalTypes: ["fitness"],
  },
  {
    name: "Apple Health",
    slug: "apple-health",
    letter: "A",
    bg: "#1a1a1a",
    color: "#fff",
    iconSlug: "apple",
    iconColor: "000000",
    activity: "workouts",
    metricLabel: "workout type and duration",
    permission2: "Verify workout type and duration",
    permission3: "Check workouts against your goal",
    goalTypes: ["fitness", "health"],
  },
  {
    name: "Duolingo",
    slug: "duolingo",
    letter: "D",
    bg: "#58CC02",
    color: "#fff",
    iconSlug: "duolingo",
    iconColor: "58CC02",
    activity: "lessons and XP",
    metricLabel: "XP earned and lessons completed",
    permission2: "Verify XP earned and lessons completed",
    permission3: "Check daily streaks against your goal",
    goalTypes: ["learning"],
  },
  {
    name: "Todoist",
    slug: "todoist",
    letter: "T",
    bg: "#DB4035",
    color: "#fff",
    iconSlug: "todoist",
    iconColor: "E44332",
    activity: "completed tasks",
    metricLabel: "tasks completed",
    permission2: "Verify tasks marked complete",
    permission3: "Check task completions against your goal",
    goalTypes: ["productivity"],
  },
  {
    name: "Fitbit",
    slug: "fitbit",
    letter: "F",
    bg: "#00B0B9",
    color: "#fff",
    iconSlug: "fitbit",
    iconColor: "00B0B9",
    activity: "workouts and steps",
    metricLabel: "activity minutes and steps",
    permission2: "Verify activity minutes and steps",
    permission3: "Check activity against your goal",
    goalTypes: ["fitness", "health"],
  },
  {
    name: "Garmin",
    slug: "garmin",
    letter: "G",
    bg: "#007CC3",
    color: "#fff",
    iconSlug: "garmin",
    iconColor: "007CC3",
    activity: "activities",
    metricLabel: "distance and duration",
    permission2: "Verify workout data and duration",
    permission3: "Check activities against your goal",
    goalTypes: ["fitness"],
  },
  {
    name: "Runkeeper",
    slug: "runkeeper",
    letter: "R",
    bg: "#3BB4E5",
    color: "#fff",
    iconSlug: "runkeeper",
    iconColor: "1F63FF",
    activity: "runs and walks",
    metricLabel: "distance and pace",
    permission2: "Verify distance and pace",
    permission3: "Check runs against your goal",
    goalTypes: ["fitness"],
  },
  {
    name: "Oura Ring",
    slug: "oura-ring",
    letter: "O",
    bg: "#2D2D2D",
    color: "#C8A951",
    iconSlug: "oura",
    iconColor: "000000",
    activity: "sleep and recovery data",
    metricLabel: "sleep score and recovery",
    permission2: "Verify sleep score and recovery",
    permission3: "Check sleep data against your goal",
    goalTypes: ["health", "fitness"],
  },
  {
    name: "Whoop",
    slug: "whoop",
    letter: "W",
    bg: "#111",
    color: "#00FF87",
    iconSlug: "whoop",
    iconColor: "0A0A0A",
    activity: "strain and recovery data",
    metricLabel: "strain score and recovery",
    permission2: "Verify strain and recovery scores",
    permission3: "Check recovery against your goal",
    goalTypes: ["health", "fitness"],
  },
  {
    name: "Notion",
    slug: "notion",
    letter: "N",
    bg: "#fff",
    color: "#0d0d0d",
    border: "0.5px solid rgba(0,0,0,0.14)",
    iconSlug: "notion",
    iconColor: "000000",
    activity: "pages and tasks",
    metricLabel: "pages created and tasks completed",
    permission2: "Verify pages created and tasks done",
    permission3: "Check Notion activity against your goal",
    goalTypes: ["productivity"],
  },
  {
    name: "GitHub",
    slug: "github",
    letter: "G",
    bg: "#24292F",
    color: "#fff",
    iconSlug: "github",
    iconColor: "181717",
    activity: "commits",
    metricLabel: "commits and pull requests",
    permission2: "Verify commits and PRs",
    permission3: "Check coding activity against your goal",
    goalTypes: ["productivity"],
  },
  {
    name: "RescueTime",
    slug: "rescuetime",
    letter: "R",
    bg: "#1B4F72",
    color: "#fff",
    iconSlug: "rescuetime",
    iconColor: "161A3B",
    activity: "focus sessions",
    metricLabel: "focused time",
    permission2: "Verify focused time logged",
    permission3: "Check focus sessions against your goal",
    goalTypes: ["productivity"],
  },
  {
    name: "MyFitnessPal",
    slug: "myfitnesspal",
    letter: "M",
    bg: "#0066CC",
    color: "#fff",
    iconSlug: "myfitnesspal",
    iconColor: "0066CC",
    activity: "meals and nutrition",
    metricLabel: "calories and macros logged",
    permission2: "Verify meals and calories logged",
    permission3: "Check nutrition logs against your goal",
    goalTypes: ["health"],
  },
];

export const FEATURED_APPS = ALL_APPS.filter((a) =>
  ["strava", "apple-health", "duolingo", "todoist"].includes(a.slug)
);

/** Returns the Simple Icons CDN URL for an app icon, colored for use on a light background. */
export function getAppIconUrl(iconSlug: string, iconColor = "000000"): string {
  return `https://cdn.simpleicons.org/${iconSlug}/${iconColor}`;
}

export function getAppBySlug(slug: string): AppInfo | null {
  return ALL_APPS.find((a) => a.slug === slug) ?? null;
}

export function getAppByName(name: string): AppInfo | null {
  const lower = name.toLowerCase();
  return (
    ALL_APPS.find((a) => a.name.toLowerCase() === lower) ??
    ALL_APPS.find(
      (a) =>
        a.name.toLowerCase().includes(lower) ||
        lower.includes(a.name.toLowerCase())
    ) ??
    null
  );
}

export function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
