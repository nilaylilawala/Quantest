import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Menubar } from "./features/menubar/menubar";

@Component({
  selector: 'app-root',
  imports: [Menubar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Quantest');
}
