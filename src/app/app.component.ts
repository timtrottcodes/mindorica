// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Routes, RouterModule } from '@angular/router';
import { Flashcards } from './pages/flashcards/flashcards';
import { Home } from './pages/home/home';
import { Topics } from './pages/topics/topics';

const routes: Routes = [
  { path: '', component: Home },
  { path: 'topics', component: Topics },
  { path: 'flashcards/:topicId', component: Flashcards },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" routerLink="/">Ankular</a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/topics">Topics</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/import">Import</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent {}
