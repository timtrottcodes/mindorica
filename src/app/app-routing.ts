// src/app/app-routing.ts
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { Home } from './pages/home/home';
import { TopicManager } from './pages/topic-manager/topic-manager';
import { Import } from './pages/import/import';
import { FlashcardManager } from './pages/flashcard-manager/flashcard-manager';
import { Study } from './pages/study/study';
import { FlashcardViewer } from './pages/flashcard-viewer/flashcard-viewer';

export const AppRoutes = {
  Home: '',
  TopicManager: 'topic-manager',
  FlashcardManager: 'flashcard-manager/:topicId',
  Import: 'import',
  StudyViewer: 'study',
  FlashcardViewer: 'flashcard-viewer/:topicId',
};

export const routes: Routes = [
  { path: AppRoutes.Home, component: Home },
  { path: AppRoutes.TopicManager, component: TopicManager },
  { path: AppRoutes.Import, component: Import },
  { path: AppRoutes.FlashcardManager, component: FlashcardManager },
  { path: AppRoutes.StudyViewer, component: Study },
  { path: AppRoutes.FlashcardViewer, component: FlashcardViewer },
];

export const appRouterProviders = [
  provideRouter(routes, withHashLocation()),
];
