import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { Recommendation } from '../../../models/glucose.models';

@Component({
  selector: 'bst-recommendation-card',
  templateUrl: './recommendation-card.html',
  styleUrl: './recommendation-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecommendationCard {
  readonly recommendation = input.required<Recommendation>();
  readonly expanded = signal(false);

  toggle(): void {
    this.expanded.update(v => !v);
  }
}
