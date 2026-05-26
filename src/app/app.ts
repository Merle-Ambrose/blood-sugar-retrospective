import { Component, signal } from '@angular/core';

@Component({
  selector: 'bst-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('blood-sugar-tracker');
}
