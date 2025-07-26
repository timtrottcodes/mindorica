import { bootstrapApplication } from '@angular/platform-browser';
import { appRouterProviders } from './app/app-routing';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [appRouterProviders],
}).catch(err => console.error(err));
