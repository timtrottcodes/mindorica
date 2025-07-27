import { Component } from '@angular/core';
import { AppRoutes } from '../../app-routing';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  AppRoutes = AppRoutes;
}
