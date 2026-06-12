export interface ExperienceEntry {
  company: string;
  logo?: string;
  roleKey: string;
  periodKey: string;
  locationKey: string;
  typeKey: string;
  bulletKeys: string[];
  technologies: string[];
  url?: string;
}

export const experience: ExperienceEntry[] = [
  {
    company: "ifeel",
    roleKey: "experience.ifeel.role",
    periodKey: "experience.ifeel.period",
    locationKey: "experience.ifeel.location",
    typeKey: "experience.ifeel.type",
    bulletKeys: [
      "experience.ifeel.bullet1",
      "experience.ifeel.bullet2",
      "experience.ifeel.bullet3",
      "experience.ifeel.bullet4",
      "experience.ifeel.bullet5",
    ],
    technologies: [
      "Kotlin",
      "Jetpack Compose",
      "Clean Architecture",
      "Coroutines & Flow",
      "Hilt",
      "Arrow-kt",
      "Room",
      "Retrofit",
      "ExoPlayer/Media3",
      "Firebase",
      "WebSocket",
      "Zoom SDK",
      "Daily.co SDK",
      "Stripe",
      "PayPal",
      "Bitrise",
      "Fastlane",
      "Detekt",
      "JUnit 5",
      "MockK",
      "Turbine",
    ],
    url: "https://www.ifeel.com",
  },
  {
    company: "Alten — SDOS",
    roleKey: "experience.alten.role",
    periodKey: "experience.alten.period",
    locationKey: "experience.alten.location",
    typeKey: "experience.alten.type",
    bulletKeys: [
      "experience.alten.bullet1",
      "experience.alten.bullet2",
      "experience.alten.bullet3",
    ],
    technologies: [
      "Kotlin",
      "Android SDK",
      "Jenkins",
      "MVVM",
      "Coroutines",
      "Retrofit",
      "Firebase",
    ],
  },
];
