import type { ImageMetadata } from "astro";
import fuelioAndroid from "~/assets/projects/fuelio_android_list.png";
import fuelioIos from "~/assets/projects/fuelio_ios_list.png";

export interface Project {
  id: string;
  nameKey: string;
  descriptionKey: string;
  highlightsKeys: string[];
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  status: "coming-soon" | "in-development" | "live" | "open-source";
  featured: boolean;
  screenshots?: {
    android: ImageMetadata;
    ios: ImageMetadata;
    alt: string;
  };
}

export const projects: Project[] = [
  {
    id: "fuelio",
    nameKey: "project.fuelio.name",
    descriptionKey: "project.fuelio.description",
    highlightsKeys: [
      "project.fuelio.highlight1",
      "project.fuelio.highlight2",
      "project.fuelio.highlight3",
      "project.fuelio.highlight4",
      "project.fuelio.highlight5",
      "project.fuelio.highlight6",
      "project.fuelio.highlight7",
    ],
    technologies: [
      "Kotlin Multiplatform",
      "Jetpack Compose",
      "Material Design 3",
      "SwiftUI",
      "Room",
      "Ktor",
      "Koin",
      "DataStore",
      "SKIE",
      "Navigation 3",
      "Coroutines & Flow",
      "Roborazzi",
      "Mokkery",
      "Turbine",
    ],
    githubUrl: "https://github.com/germanbustamante/Fuelio-KMP",
    status: "open-source",
    featured: true,
    screenshots: {
      android: fuelioAndroid,
      ios: fuelioIos,
      alt: "Fuelio's gas station list screen on Android (Jetpack Compose) and iOS (SwiftUI)",
    },
  },
  {
    id: "ringtone-manager",
    nameKey: "project.ringtone.name",
    descriptionKey: "project.ringtone.description",
    highlightsKeys: [
      "project.ringtone.highlight1",
      "project.ringtone.highlight2",
      "project.ringtone.highlight3",
      "project.ringtone.highlight4",
      "project.ringtone.highlight5",
      "project.ringtone.highlight6",
    ],
    technologies: [
      "Kotlin",
      "Jetpack Compose",
      "Navigation 3",
      "Koin",
      "Arrow-kt",
      "Room",
      "Media3",
      "Firebase",
      "JUnit 5",
      "MockK",
      "Turbine",
      "Paparazzi",
      "Kover",
      "Detekt",
    ],
    githubUrl: "https://github.com/germanbustamante/Ringtone-Manager",
    status: "live",
    featured: true,
  },
  {
    id: "inadraft",
    nameKey: "project.inadraft.name",
    descriptionKey: "project.inadraft.description",
    highlightsKeys: [
      "project.inadraft.highlight1",
      "project.inadraft.highlight2",
      "project.inadraft.highlight3",
      "project.inadraft.highlight4",
    ],
    technologies: ["Kotlin", "Android SDK", "Firebase", "Gradle"],
    githubUrl: "https://github.com/GermanBustamante/InaDraft",
    status: "in-development",
    featured: true,
  },
];
