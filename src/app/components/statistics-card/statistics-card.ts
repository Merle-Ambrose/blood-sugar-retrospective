import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MMOL_TO_MGDL, UNIT_MMOL } from '../../models/glucose.models';
import { GlucoseDataService } from '../../services/glucose-data.service';

@Component({
  selector: 'bst-statistics-card',
  templateUrl: './statistics-card.html',
  styleUrl: './statistics-card.scss',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsCard {
  private readonly dataService = inject(GlucoseDataService);

  readonly stats = this.dataService.statistics;
  readonly displayUnit = this.dataService.displayUnit;

  get avgDisplay(): string {
    const avg = this.stats().averageMgDl;
    if (this.displayUnit() === UNIT_MMOL) return (avg / MMOL_TO_MGDL).toFixed(1);
    return Math.round(avg).toString();
  }
}
