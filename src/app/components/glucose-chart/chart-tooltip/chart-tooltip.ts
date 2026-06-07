import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChartPoint, GlucoseUnit, MMOL_TO_MGDL, UNIT_MMOL } from '../../../models/glucose.models';

const TOOLTIP_EDGE_THRESHOLD = 90;

@Component({
  selector: 'bst-chart-tooltip',
  templateUrl: './chart-tooltip.html',
  styleUrl: './chart-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartTooltip {
  readonly point = input<ChartPoint | null>(null);
  readonly unit = input.required<GlucoseUnit>();
  readonly containerWidth = input.required<number>();

  get displayValue(): string {
    const p = this.point();
    if (!p) return '';
    const v = this.unit() === UNIT_MMOL
      ? (p.reading.valueMgDl / MMOL_TO_MGDL).toFixed(1)
      : Math.round(p.reading.valueMgDl).toString();
    return `${v} ${this.unit()}`;
  }

  get timestamp(): string {
    const p = this.point();
    if (!p) return '';
    return p.reading.timestamp.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }

  get style(): Record<string, string> {
    const p = this.point();
    if (!p) return {};
    const w = this.containerWidth();
    let transform = 'translateX(-50%)';
    if (p.x < TOOLTIP_EDGE_THRESHOLD) transform = 'translateX(0)';
    else if (p.x > w - TOOLTIP_EDGE_THRESHOLD) transform = 'translateX(-100%)';
    return {
      left: `${p.x}px`,
      top: `${Math.max(0, p.y - 48)}px`,
      transform,
    };
  }
}
