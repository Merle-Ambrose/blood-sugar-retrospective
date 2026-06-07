import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GlucoseDataService } from '../../services/glucose-data.service';
import { RecommendationCard } from './recommendation-card/recommendation-card';

@Component({
  selector: 'bst-recommendations',
  templateUrl: './recommendations.html',
  styleUrl: './recommendations.scss',
  imports: [RecommendationCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Recommendations {
  private readonly dataService = inject(GlucoseDataService);
  readonly recommendations = this.dataService.recommendations;
}
