// src/app/app-routing.ts
import { Routes, provideRouter } from '@angular/router';
import { Home } from './pages/home/home';
import { TopicManager } from './pages/topic-manager/topic-manager';
import { Import } from './pages/import/import';
import { FlashcardManager } from './pages/flashcard-manager/flashcard-manager';

export const AppRoutes = {
  Home: '',
  TopicManager: 'topic-manager',
  FlashcardManager: 'flashcard-manager/:topicId',
  Import: 'import',
  StudyViewer: 'study'
};

export const routes: Routes = [
  { path: AppRoutes.Home, component: Home },
  { path: AppRoutes.TopicManager, component: TopicManager },
  { path: AppRoutes.Import, component: Import },
  { path: AppRoutes.FlashcardManager, component: FlashcardManager },
];

export const appRouterProviders = [
  provideRouter(routes),
];
