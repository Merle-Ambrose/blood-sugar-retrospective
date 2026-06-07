import { Injectable, computed, signal } from '@angular/core';
import {
  DateRange,
  GlucosePattern,
  GlucoseSession,
  GlucoseStatistics,
  GlucoseUnit,
  ParseResult,
  RawGlucoseReading,
  Recommendation,
  UNIT_MGDL,
} from '../models/glucose.models';
import { PatternDetectionService } from './pattern-detection.service';
import { RecommendationService } from './recommendation.service';
import { StatisticsService } from './statistics.service';

/**
 * Single source of truth for all glucose data in the app.
 * Holds the loaded CSV session and all derived state as Angular signals.
 * Components should inject this service and read signals directly!
 */
@Injectable({ providedIn: 'root' })
export class GlucoseDataService {
  private readonly statisticsService = new StatisticsService();
  private readonly patternService = new PatternDetectionService();
  private readonly recommendationService = new RecommendationService();

  /** The parsed CSV session, or `null` when no file has been loaded. */
  readonly session = signal<GlucoseSession | null>(null);

  /** The unit shown in the UI (`'mg/dL'` or `'mmol/L'`). Internal values are always mg/dL. */
  readonly displayUnit = signal<GlucoseUnit>(UNIT_MGDL);

  /**
   * The active date filter window. When `null`, all readings from the session are included.
   * Set via {@link setDateRange}.
   */
  readonly dateRange = signal<DateRange | null>(null);

  /** `true` while a CSV file is being parsed. Use to show a loading indicator. */
  readonly isLoading = signal(false);

  /**
   * All readings from {@link session} that fall within {@link dateRange}.
   * When `dateRange` is `null` this equals the full session readings.
   * Values are always in mg/dL.
   */
  readonly filteredReadings = computed<RawGlucoseReading[]>(() => {
    const s = this.session();
    if (!s) return [];
    const range = this.dateRange();
    if (!range) return s.readings;
    return s.readings.filter(
      r => r.timestamp >= range.start && r.timestamp <= range.end
    );
  });

  /**
   * Readings prepared for display. Currently identical to {@link filteredReadings}
   * because axis labels handle the mmol/L conversion; all `valueMgDl` fields remain in mg/dL.
   */
  readonly displayReadings = computed<RawGlucoseReading[]>(() => {
    const readings = this.filteredReadings();
    const unit = this.displayUnit();
    if (unit === UNIT_MGDL) return readings;
    // Return copies with value converted for display (valueMgDl field stays in mg/dL internally,
    // but chart service uses displayUnit to format axis labels, no conversion needed here)
    return readings;
  });

  /** Aggregate stats (mean, time in range, GMI, etc.) derived from {@link filteredReadings}. */
  readonly statistics = computed<GlucoseStatistics>(() =>
    this.statisticsService.calculate(this.filteredReadings())
  );

  /** Detected behavioural patterns (e.g. nocturnal highs, post meal spikes) from {@link filteredReadings}. */
  readonly patterns = computed<GlucosePattern[]>(() =>
    this.patternService.detect(this.filteredReadings())
  );

  /** Actionable recommendations derived from {@link patterns}. */
  readonly recommendations = computed<Recommendation[]>(() =>
    this.recommendationService.buildRecommendations(this.patterns())
  );

  /**
   * Loads a parsed CSV result into the service.
   * Resets {@link dateRange} so the full session is visible immediately.
   */
  loadSession(result: ParseResult): void {
    if (result.session) {
      this.session.set(result.session);
      this.dateRange.set(null);
    }
  }

  /** Narrows the visible readings to `range`. Pass `null` to show all readings. */
  setDateRange(range: DateRange | null): void {
    this.dateRange.set(range);
  }

  /** Switches the display unit between `'mg/dL'` and `'mmol/L'`. */
  setDisplayUnit(unit: GlucoseUnit): void {
    this.displayUnit.set(unit);
  }

  /** Clears the loaded session and resets the date range. */
  clearData(): void {
    this.session.set(null);
    this.dateRange.set(null);
  }
}
