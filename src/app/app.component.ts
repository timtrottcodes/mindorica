// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Routes, RouterModule, Router, NavigationEnd } from '@angular/router';
import { AppRoutes } from "../app/app-routing"
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterModule, CommonModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" [routerLink]="[AppRoutes.Home]">Mindorica</a>
        
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
              <a class="nav-link" [routerLink]="[AppRoutes.Home]">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [routerLink]="[AppRoutes.TopicManager]">Topic Admin</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [routerLink]="[AppRoutes.Import]">Import/Export</a>
            </li>
          </ul>

          <div class="form-check form-switch text-light ms-3">
            <input class="form-check-input" type="checkbox" id="darkModeToggle" (change)="toggleDarkMode()" [checked]="darkModeEnabled">
            <label class="form-check-label" for="darkModeToggle">Dark Mode</label>
          </div>
        </div>
      </div>
    </nav>

    <!-- If on homepage, no container or mt-4 -->
    <div *ngIf="isHomePage; else withContainer">
      <router-outlet></router-outlet>
    </div>

    <!-- On other pages, wrap with container and margin -->
    <ng-template #withContainer>
      <div class="container mt-4">
        <router-outlet></router-outlet>
      </div>
    </ng-template>

    <footer class="text-muted text-center py-3 mt-auto">
      &copy; 2025 Mindorica — All rights reserved.
    </footer>
  `,
})
export class AppComponent {
  AppRoutes = AppRoutes;
  isHomePage = false;
  darkModeEnabled = false;

  constructor(private router: Router) {
    // Route-based home flag
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isHomePage = event.urlAfterRedirects === '/' || event.urlAfterRedirects === '/home';
      });

    // Load theme preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      this.enableDarkMode();
    }
  }

  toggleDarkMode(): void {
    this.darkModeEnabled = !this.darkModeEnabled;
    if (this.darkModeEnabled) {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }
  }

  enableDarkMode(): void {
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
    this.darkModeEnabled = true;
  }

  disableDarkMode(): void {
    document.body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
    this.darkModeEnabled = false;
  }
}

