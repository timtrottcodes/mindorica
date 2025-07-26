import { Routes } from '@angular/router';
import { Flashcards } from './pages/flashcards/flashcards';

export const routes: Routes = [
    { path: 'flashcards/:topicId', component: Flashcards },
];
