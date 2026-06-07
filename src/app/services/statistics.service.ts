import { Injectable } from '@angular/core';
import { A1C_FORMULA_INTERCEPT, A1C_FORMULA_SLOPE, GlucoseStatistics, HIGH_THRESHOLD_MGDL, LOW_THRESHOLD_MGDL, RawGlucoseReading } from '../models/glucose.models';

/** Computes aggregate statistics from a set of glucose readings. */
@Injectable({ providedIn: 'root' })
export class StatisticsService {

  /**
   * Calculates % time in range, time below and above range, average glucose,
   * estimated A1C, GMI, and standard deviation from `readings`.
   * Returns all-zero statistics when `readings` is empty.
   */
  calculate(readings: RawGlucoseReading[]): GlucoseStatistics {
    if (readings.length === 0) {
      return {
        timeInRangePct: 0,
        timeBelowRangePct: 0,
        timeAboveRangePct: 0,
        averageMgDl: 0,
        estimatedA1C: 0,
        gmi: 0,
        standardDeviation: 0,
        readingCount: 0,
      };
    }

    const values = readings.map(r => r.valueMgDl);
    const total = values.length;

    const inRange = values.filter(v => v >= LOW_THRESHOLD_MGDL && v <= HIGH_THRESHOLD_MGDL).length;
    const below = values.filter(v => v < LOW_THRESHOLD_MGDL).length;
    const above = values.filter(v => v > HIGH_THRESHOLD_MGDL).length;

    const avg = values.reduce((s, v) => s + v, 0) / total; // aka the mean
    const sd = this.standardDeviation(values, avg);
    // 28.7 * eA1c - 46.7 = avgBloodGlucose
    // (avgBloodGlucose + 46.7) / 28.7 = eA1c
    // https://professional.diabetes.org/glucose_calc
    const a1c = (avg + A1C_FORMULA_INTERCEPT) / A1C_FORMULA_SLOPE;

    return {
      timeInRangePct: (inRange / total) * 100,
      timeBelowRangePct: (below / total) * 100,
      timeAboveRangePct: (above / total) * 100,
      averageMgDl: avg,
      estimatedA1C: a1c,
      gmi: a1c,
      standardDeviation: sd,
      readingCount: total,
    };
  }

  /**
   * Returns the sample standard deviation of `values`, a measure of how widely glucose
   * readings are spread around the mean. A lower value means more stable glucose.
   * 
   * https://stackoverflow.com/questions/7343890/standard-deviation-javascript
   * Formula: SD = sqrt( Σ(x − μ)² / (n − 1) )
   *   Σ(x − μ)²  sum of squared differences from the mean
   *   n − 1      n = length of the array
   */
  private standardDeviation(values: number[], mean: number): number {
    if (values.length < 2) return 0;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }
}
