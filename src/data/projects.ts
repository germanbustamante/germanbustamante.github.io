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
    id: "kmp-notes",
    nameKey: "project.kmp_notes.name",
    descriptionKey: "project.kmp_notes.description",
    highlightsKeys: [
      "project.kmp_notes.highlight1",
      "project.kmp_notes.highlight2",
      "project.kmp_notes.highlight3",
      "project.kmp_notes.highlight4",
      "project.kmp_notes.highlight5",
    ],
    technologies: [
      "KMP",
      "Kotlin",
      "Jetpack Compose",
      "SwiftUI",
      "Ktor",
      "SQLDelight",
      "Koin",
      "Coroutines & Flow",
    ],
    status: "coming-soon",
    featured: true,
  },
  {
    id: "moviearch",
    nameKey: "project.moviearch.name",
    descriptionKey: "project.moviearch.description",
    highlightsKeys: [
      "project.moviearch.highlight1",
      "project.moviearch.highlight2",
      "project.moviearch.highlight3",
      "project.moviearch.highlight4",
      "project.moviearch.highlight5",
      "project.moviearch.highlight6",
    ],
    technologies: [
      "Kotlin",
      "Jetpack Compose",
      "Hilt",
      "Coroutines & Flow",
      "Arrow-kt",
      "Room",
      "Retrofit",
      "JUnit 5",
      "MockK",
      "Turbine",
      "Detekt",
      "JaCoCo",
      "GitHub Actions",
      "Gradle Convention Plugins",
    ],
    status: "coming-soon",
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
    ],
    technologies: [
      "Kotlin",
      "Jetpack Compose",
      "Media3",
      "Firebase",
      "Hilt",
      "Coroutines & Flow",
      "Material Design 3",
    ],
    githubUrl: "https://github.com/GermanBustamante/Ringtone-Manager",
    status: "in-development",
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
    technologies: [
      "Kotlin",
      "Android SDK",
      "Firebase",
      "Gradle",
    ],
    githubUrl: "https://github.com/GermanBustamante/InaDraft",
    status: "in-development",
    featured: true,
  },
];
