import { Routes } from '@angular/router';
import { FlashcardManager } from './pages/flashcard-manager/flashcard-manager';

export const routes: Routes = [
    { path: 'flashcards/:topicId', component: FlashcardManager },
];
