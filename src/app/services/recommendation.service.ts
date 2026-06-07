import { Injectable } from '@angular/core';
import { GlucosePattern, Recommendation, SEVERITY_ORDER } from '../models/glucose.models';

type PatternKey = `${GlucosePattern['type']}:${GlucosePattern['severity']}`;

const RECOMMENDATION_MAP: Record<PatternKey, { title: string; body: string }> = {
  'dawn-phenomenon:mild': {
    title: 'Mild Morning Glucose Rise',
    body: 'Your glucose rises moderately in the early morning hours. This can be a normal physiological response to overnight hormone changes. Please make adjustments as needed to your overnight basal dose or timing.',
  },
  'dawn-phenomenon:moderate': {
    title: 'Moderate Dawn Phenomenon Detected',
    body: 'A consistent and notable morning glucose rise is present across multiple days. This pattern, known as the dawn phenomenon, is driven by overnight release of growth hormone and cortisol. Please make adjustments as needed to your basal insulin timing or dose.',
  },
  'dawn-phenomenon:severe': {
    title: 'Significant Dawn Phenomenon',
    body: 'Your morning glucose readings are substantially elevated compared to early-night levels on many days. This may indicate that your current overnight basal rate or long-acting insulin is insufficient for your early-morning needs. Please make adjustments as needed.',
  },
  'post-meal-spike:mild': {
    title: 'Occasional Post-Meal Spikes',
    body: 'Some rapid glucose rises above 180 mg/dL are present. This may reflect meal timing, carbohydrate content, or bolus insulin timing. Consider whether pre-meal insulin is given early enough before eating.',
  },
  'post-meal-spike:moderate': {
    title: 'Frequent Post-Meal Hyperglycemia',
    body: 'Repeated rapid rises above 180 mg/dL suggest consistent post-meal spikes. Review meal composition, portion sizes, and bolus timing, please make adjustments as needed. Pre-bolusing (taking rapid insulin 15-20 min before meals) may help flatten these spikes.',
  },
  'post-meal-spike:severe': {
    title: 'Persistent Post-Meal Spikes',
    body: 'Frequent and significant post-meal glucose spikes are present throughout the data. This pattern significantly impacts time-in-range. Please make adjustments as needed to your mealtime insulin dosing strategy, including carb ratios and correction factors.',
  },
  'overnight-low:mild': {
    title: 'Occasional Overnight Lows',
    body: 'Glucose drops below 70 mg/dL overnight on several nights. While mild, nocturnal hypoglycemia warrants attention. Review whether your bedtime snack, basal insulin dose, or evening activity might be contributing.',
  },
  'overnight-low:moderate': {
    title: 'Recurring Overnight Hypoglycemia',
    body: 'Glucose falls into the 54-69 mg/dL range overnight on multiple nights. This recurring pattern increases risk of impaired awareness of hypoglycemia over time. Please make adjustments as needed, consider reducing your overnight basal rate.',
  },
  'overnight-low:severe': {
    title: 'Severe Overnight Lows Detected',
    body: 'Glucose has dropped below 54 mg/dL overnight, a clinically significant level. Severe nocturnal hypoglycemia is a serious safety concern. Please make adjustments as needed to your basal insulin and overnight management.',
  },
};

/** Maps detected glucose patterns to user-facing recommendations using a static lookup table. */
@Injectable({ providedIn: 'root' })
export class RecommendationService {

  /**
   * Maps each pattern to a recommendation from {@link RECOMMENDATION_MAP}, drops any without
   * a matching entry, then sorts the result by severity (severe first).
   */
  buildRecommendations(patterns: GlucosePattern[]): Recommendation[] {
    return patterns
      .map((p): Recommendation | null => {
        const key: PatternKey = `${p.type}:${p.severity}`;
        const template = RECOMMENDATION_MAP[key];
        if (!template) return null;
        return {
          id: key,
          patternType: p.type,
          title: template.title,
          body: template.body,
          severity: p.severity,
        };
      })
      .filter((r): r is Recommendation => r !== null)
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }
}
