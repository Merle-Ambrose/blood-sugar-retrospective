import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { GlucoseDataService } from '../../services/glucose-data.service';
import { UnitToggle } from '../unit-toggle/unit-toggle';
import { DateRangeFilter } from '../date-range-filter/date-range-filter';
import { StatisticsCard } from '../statistics-card/statistics-card';
import { GlucoseChart } from '../glucose-chart/glucose-chart';
import { Recommendations } from '../recommendations/recommendations';
import { Upload } from '../upload/upload';

@Component({
  selector: 'bst-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  imports: [UnitToggle, DateRangeFilter, StatisticsCard, GlucoseChart, Recommendations, Upload, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly dataService = inject(GlucoseDataService);

  readonly session = this.dataService.session;

  clearData(): void {
    this.dataService.clearData();
  }
}
