import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { GlucoseDataService } from '../../services/glucose-data.service';

@Component({
  selector: 'bst-date-range-filter',
  templateUrl: './date-range-filter.html',
  styleUrl: './date-range-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeFilter {
  private readonly dataService = inject(GlucoseDataService);

  readonly session = this.dataService.session;
  readonly dateRange = this.dataService.dateRange;

  readonly startValue = computed(() => {
    const range = this.dateRange();
    return range ? this.toInputValue(range.start) : '';
  });

  readonly endValue = computed(() => {
    const range = this.dateRange();
    return range ? this.toInputValue(range.end) : '';
  });

  readonly minDate = computed(() => {
    const s = this.session();
    return s ? this.toInputValue(s.startDate) : '';
  });

  readonly maxDate = computed(() => {
    const s = this.session();
    return s ? this.toInputValue(s.endDate) : '';
  });

  selectPreset(days: number | null): void {
    if (days === null) {
      this.dataService.setDateRange(null);
      return;
    }
    const session = this.session();
    if (!session) return;
    const end = this.endOfDay(session.endDate);
    const start = this.startOfDay(new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
    this.dataService.setDateRange({ start, end });
  }

  onStartChange(value: string): void {
    if (!value) return;
    const session = this.session();
    const end = this.dateRange()?.end ?? session?.endDate;
    if (!end) return;
    this.dataService.setDateRange({ start: this.parseDateLocal(value), end });
  }

  onEndChange(value: string): void {
    if (!value) return;
    const session = this.session();
    const start = this.dateRange()?.start ?? session?.startDate;
    if (!start) return;
    this.dataService.setDateRange({ start, end: this.endOfDay(this.parseDateLocal(value)) });
  }

  private parseDateLocal(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }

  private toInputValue(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
