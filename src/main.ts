import { bootstrapApplication } from '@angular/platform-browser';
import { ErrorHandler } from '@angular/core';
import { appRouterProviders } from './app/app-routing';
import { AppComponent } from './app/app.component';
import { GlobalErrorHandler } from './app/services/error-handler';

bootstrapApplication(AppComponent, {
  providers: [
    appRouterProviders,
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
}).catch(err => console.error(err));
