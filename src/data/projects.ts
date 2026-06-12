export interface Project {
  id: string;
  nameKey: string;
  descriptionKey: string;
  highlightsKeys: string[];
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  status: "coming-soon" | "in-development" | "live";
  featured: boolean;
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
    ],
    technologies: [
      "Kotlin Multiplatform",
      "Compose Multiplatform",
      "Android",
      "iOS",
      "Ktor",
      "Koin",
      "Coroutines & Flow",
      "Material Design 3",
      "Mokkery",
      "Turbine",
    ],
    githubUrl: "https://github.com/germanbustamante/Fuelio",
    status: "live",
    featured: true,
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
