import { defaultLanguage as defaultLang } from '../home/ui';

export const projectTranslationKeys = {
  'en': {
    'project.title': 'Projects',
    'project.description': 'I am an Android developer and I am passionate about creating useful and well-designed applications. Throughout my career, I have worked on various projects, from ringtone management to applications with real-time integration using Firebase. On this page you can see the projects I have contributed to and the ones I have developed. Explore and discover more!',

    // Project status
    'project.author_role': 'author',

    // Ringtone Manager project
    'project.ringtone_manager.name': 'Ringtone Manager (in development)',
    'project.ringtone_manager.description': 'Ringtone Manager is an Android app for managing and customizing ringtones, alarms, and notifications. It allows users to easily add and assign tones. The backend is managed with Firebase for optimal performance and real-time synchronization. Coming soon to the Play Store.',

    // InaDraft project
    'project.inadraft.name': 'InaDraft',
    'project.inadraft.description': 'An Android application to create custom templates of your favorite players from the Inazuma Eleven soccer series. Choose a lineup, create your favorite team, and enter the ranking of the best created teams. It was my final degree project and was created from scratch, from the app to the backend, developed with .NET. It\'s currently down because I ran out of student credits to maintain it, but I plan to migrate it to Firebase and resume this project.',
  },
  'es': {
    'project.title': 'Proyectos',
    'project.description': 'Soy desarrollador de Android y me apasiona crear aplicaciones útiles y bien diseñadas. A lo largo de mi carrera, he trabajado en diversos proyectos, desde la gestión de tonos de llamada hasta aplicaciones con integración en tiempo real mediante Firebase. En esta página puedes ver los proyectos en los que he contribuido y los que he desarrollado. ¡Explora y descubre más!',

    // Estado del proyecto
    'project.author_role': 'autor',

    // Proyecto Ringtone Manager
    'project.ringtone_manager.name': 'Ringtone Manager (en desarrollo)',
    'project.ringtone_manager.description': 'Ringtone Manager es una app Android para gestionar y personalizar tonos de llamada, alarmas y notificaciones. Permite a los usuarios agregar y asignar tonos fácilmente. El backend está gestionado con Firebase para un rendimiento óptimo y una sincronización en tiempo real. Próximamente disponible en la Play Store.',

    // Proyecto InaDraft
    'project.inadraft.name': 'InaDraft',
    'project.inadraft.description': 'Una aplicación Android para crear plantillas personalizadas de tus jugadores favoritos de la serie de fútbol Inazuma Eleven. Elige una alineación, crea tu equipo favorito y entra en el ranking de los mejores equipos creados. Fué mi proyecto de TFG y esta creado desde cero, desde la app hasta el backend, desarrolado con .NET, este actualmente ya está caído porque se me acabaron los bonos de estudiante para mantenerlo, pero pienso migrarlo a Firebase y retomar este proyecto.',
  }
};


export function useTranslations(lang: keyof typeof projectTranslationKeys) {
  return function t(key: keyof typeof projectTranslationKeys[typeof defaultLang]) {
    return projectTranslationKeys[lang][key] || projectTranslationKeys[defaultLang][key];
  }
}