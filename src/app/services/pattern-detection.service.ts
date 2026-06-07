import { Injectable } from '@angular/core';
import {
  DAWN_MIN_PEAK_MGDL,
  DAWN_MIN_QUALIFYING_DAYS,
  DAWN_MIN_RISE_MGDL,
  DAWN_MODERATE_PEAK_MGDL,
  DAWN_PEAK_END_HOUR,
  DAWN_PEAK_START_HOUR,
  DAWN_PREDAWN_END_HOUR,
  DAWN_PREDAWN_START_HOUR,
  DAWN_SEVERE_PEAK_MGDL,
  GlucosePattern,
  LOW_MODERATE_MGDL,
  LOW_SEVERE_MGDL,
  LOW_THRESHOLD_MGDL,
  MIN_READINGS_FOR_DETECTION,
  OVERNIGHT_END_HOUR,
  OVERNIGHT_MIN_NIGHTS,
  PATTERN_DAWN,
  PATTERN_OVERNIGHT_LOW,
  PATTERN_POST_MEAL_SPIKE,
  RawGlucoseReading,
  SEVERITY_MILD,
  SEVERITY_MODERATE,
  SEVERITY_SEVERE,
  HIGH_THRESHOLD_MGDL,
  SPIKE_COOLDOWN_MS,
  SPIKE_LOOKFORWARD_MINUTES,
  SPIKE_MIN_EVENTS,
  SPIKE_MIN_RISE_MGDL,
  SPIKE_MODERATE_COUNT,
  SPIKE_SEVERE_COUNT,
} from '../models/glucose.models';
import { groupByDate, hourOf } from '../utils/date-utils';

/**
 * Analyses a set of glucose readings and identifies recurring glucose patterns.
 * Requires at least {@link MIN_READINGS_FOR_DETECTION} readings; returns an empty array otherwise.
 */
@Injectable({ providedIn: 'root' })
export class PatternDetectionService {

  /**
   * Runs all pattern detectors against `readings` and returns those that meet
   * their minimum occurrence threshold.
   */
  detect(readings: RawGlucoseReading[]): GlucosePattern[] {
    if (readings.length < MIN_READINGS_FOR_DETECTION) return [];

    const patterns: GlucosePattern[] = [];

    const dawn = this.detectDawnPhenomenon(readings);
    if (dawn) patterns.push(dawn);

    const spikes = this.detectPostMealSpikes(readings);
    if (spikes) patterns.push(spikes);

    const lows = this.detectOvernightLows(readings);
    if (lows) patterns.push(lows);

    return patterns;
  }

  /**
   * Detects the dawn phenomenon: a consistent glucose rise from a 2am to 4am lowest point
   * up to a 6am to 9am peak. Requires at least {@link DAWN_MIN_QUALIFYING_DAYS} qualifying days to report.
   */
  private detectDawnPhenomenon(readings: RawGlucoseReading[]): GlucosePattern | null {
    const byDate = groupByDate(readings);
    let flaggedDays = 0;
    let peakValues: number[] = [];

    for (const dayReadings of byDate.values()) {
      const predawnValues = dayReadings
        .filter(r => hourOf(r) >= DAWN_PREDAWN_START_HOUR && hourOf(r) < DAWN_PREDAWN_END_HOUR)
        .map(r => r.valueMgDl);
      const peak = dayReadings
        .filter(r => hourOf(r) >= DAWN_PEAK_START_HOUR && hourOf(r) < DAWN_PEAK_END_HOUR)
        .map(r => r.valueMgDl);

      if (predawnValues.length === 0 || peak.length === 0) continue;

      const predawnMin = Math.min(...predawnValues);
      const maxPeak = Math.max(...peak);

      // Count how many days the dawnphenomenon pattern occurs
      if (maxPeak - predawnMin > DAWN_MIN_RISE_MGDL && maxPeak > DAWN_MIN_PEAK_MGDL) {
        flaggedDays++;
        peakValues.push(maxPeak);
      }
    }

    if (flaggedDays < DAWN_MIN_QUALIFYING_DAYS) return null;

    const avgPeak = peakValues.reduce((s, v) => s + v, 0) / peakValues.length;
    const severity = avgPeak > DAWN_SEVERE_PEAK_MGDL ? SEVERITY_SEVERE : avgPeak > DAWN_MODERATE_PEAK_MGDL ? SEVERITY_MODERATE : SEVERITY_MILD;

    return {
      type: PATTERN_DAWN,
      severity,
      description: `Morning glucose rises significantly on ${flaggedDays} days (avg peak ${Math.round(avgPeak)} mg/dL).`,
      occurrences: flaggedDays,
    };
  }

  /**
   * Detects post meal spikes: baseline not in low range (>= {@link LOW_THRESHOLD_MGDL}),
   * rising by >= {@link SPIKE_MIN_RISE_MGDL} mg/dL to a peak above {@link HIGH_THRESHOLD_MGDL}
   * within {@link SPIKE_LOOKFORWARD_MINUTES} minutes, without crossing a sensor gap.
   * Events within {@link SPIKE_COOLDOWN_MS} ms of a prior spike are skipped.
   */
  private detectPostMealSpikes(readings: RawGlucoseReading[]): GlucosePattern | null {
    let spikeEvents = 0;
    let lastSpikeTime = 0;

    for (let i = 0; i < readings.length; i++) {
      const baseline = readings[i];

      if (baseline.valueMgDl < LOW_THRESHOLD_MGDL) continue;
      if (baseline.timestamp.getTime() - lastSpikeTime < SPIKE_COOLDOWN_MS) continue;

      let peak = baseline.valueMgDl;
      let peakTime = baseline.timestamp.getTime();

      for (let j = i + 1; j < readings.length; j++) {
        const curr = readings[j];
        const totalMinutes = (curr.timestamp.getTime() - baseline.timestamp.getTime()) / 60000;
        if (totalMinutes > SPIKE_LOOKFORWARD_MINUTES) break;

        const gapMinutes = (curr.timestamp.getTime() - readings[j - 1].timestamp.getTime()) / 60000;
        if (gapMinutes > 30) break;

        if (curr.valueMgDl > peak) {
          peak = curr.valueMgDl;
          peakTime = curr.timestamp.getTime();
        }
      }

      if (peak >= HIGH_THRESHOLD_MGDL && peak - baseline.valueMgDl >= SPIKE_MIN_RISE_MGDL) {
        spikeEvents++;
        lastSpikeTime = peakTime;
        while (i + 1 < readings.length && readings[i + 1].timestamp.getTime() <= peakTime) i++;
      }
    }

    if (spikeEvents < SPIKE_MIN_EVENTS) return null;

    const severity = spikeEvents >= SPIKE_SEVERE_COUNT ? SEVERITY_SEVERE : spikeEvents >= SPIKE_MODERATE_COUNT ? SEVERITY_MODERATE : SEVERITY_MILD;
    return {
      type: PATTERN_POST_MEAL_SPIKE,
      severity,
      description: `${spikeEvents} post meal spikes detected: glucose rose ${SPIKE_MIN_RISE_MGDL}+ mg/dL from a non-low baseline to above ${HIGH_THRESHOLD_MGDL} mg/dL within ${SPIKE_LOOKFORWARD_MINUTES} minutes.`,
      occurrences: spikeEvents,
    };
  }

  /**
   * Detects overnight low events: readings below {@link LOW_THRESHOLD_MGDL} mg/dL between midnight and 6am.
   * Returns a pattern when lows occur on at least {@link OVERNIGHT_MIN_NIGHTS} separate nights.
   */
  private detectOvernightLows(readings: RawGlucoseReading[]): GlucosePattern | null {
    const byDate = groupByDate(readings);
    const nightMinima: number[] = [];

    for (const dayReadings of byDate.values()) {
      // Check overnight numbers of a specific day
      const lows = dayReadings
        .filter(r => hourOf(r) < OVERNIGHT_END_HOUR && r.valueMgDl < LOW_THRESHOLD_MGDL)
        .map(r => r.valueMgDl);

      // Collects lowest glucose reading per night
      if (lows.length > 0) nightMinima.push(Math.min(...lows));
    }

    if (nightMinima.length < OVERNIGHT_MIN_NIGHTS) return null;

    const minVal = Math.min(...nightMinima);
    const severity = minVal < LOW_SEVERE_MGDL ? SEVERITY_SEVERE : minVal < LOW_MODERATE_MGDL ? SEVERITY_MODERATE : SEVERITY_MILD;

    return {
      type: PATTERN_OVERNIGHT_LOW,
      severity,
      description: `Low glucose overnight (<${LOW_THRESHOLD_MGDL} mg/dL) detected on ${nightMinima.length} nights (lowest: ${Math.round(minVal)} mg/dL).`,
      occurrences: nightMinima.length,
    };
  }
}
