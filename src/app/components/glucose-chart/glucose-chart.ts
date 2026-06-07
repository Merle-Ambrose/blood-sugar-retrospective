import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ChartTooltip } from './chart-tooltip/chart-tooltip';
import { ChartPoint, MMOL_TO_MGDL, UNIT_MMOL } from '../../models/glucose.models';
import { GlucoseDataService } from '../../services/glucose-data.service';

// Fixed pixel height of the SVG canvas. Width is dynamic (tracks the container element).
const CHART_HEIGHT = 300;

// Upper bound on how many data points are rendered. When a session has more readings
// than this, the array is thinned by taking every Nth point so the SVG stays fast.
const MAX_POINTS = 500;

// The Y axis covers 40 to 400 mg/dL. Values outside this range are clamped rather
// than auto scaling so that band positions (low/target/high) stay visually stable
// regardless of which session is loaded.
const VALUE_MIN = 40;
const VALUE_MAX = 400;

@Component({
  selector: 'bst-glucose-chart',
  templateUrl: './glucose-chart.html',
  styleUrl: './glucose-chart.scss',
  imports: [ChartTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlucoseChart {
  private readonly dataService = inject(GlucoseDataService);
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  // Starts at 800 as a reasonable fallback before the ResizeObserver fires its first measurement.
  readonly containerWidth = signal(800);

  // Tracks which chart point is directly under (or nearest to) the mouse cursor.
  // Null when the mouse is not over the chart. The template uses this to show the tooltip.
  readonly hoveredPoint = signal<ChartPoint | null>(null);

  private resizeObserver?: ResizeObserver;

  // Exposed as a plain property so the template can read the constant without importing it.
  readonly chartHeight = CHART_HEIGHT;

  // The filtered set of readings (respects the active date range) straight from the service.
  readonly readings = this.dataService.filteredReadings;

  // Whether to display values as mg/dL or mmol/L. Comes from the unit toggle in the service.
  readonly displayUnit = this.dataService.displayUnit;

  // A computed signal that converts raw readings into SVG coordinate objects (ChartPoint).
  // It re-runs automatically whenever readings or containerWidth changes.
  readonly displayPoints = computed<ChartPoint[]>(() => {
    const readings = this.readings();
    if (readings.length === 0) return [];

    // Thin the array if there are more readings than MAX_POINTS. "step" is how many
    // readings to skip between each kept point so the total stays at or below the cap.
    const step = Math.max(1, Math.floor(readings.length / MAX_POINTS));
    const thinned = readings.filter((_, i) => i % step === 0);

    // Grab the earliest and latest timestamps so we can normalize time to [0, 1],
    // then scale that fraction to the pixel width of the container.
    const minTs = thinned[0].timestamp.getTime();
    const maxTs = thinned[thinned.length - 1].timestamp.getTime();
    // Guard against a session with a single reading so we never divide by zero.
    const tsRange = maxTs === minTs ? 1 : maxTs - minTs;
    const w = this.containerWidth();

    return thinned.map(r => ({
      // X: map the reading's position in time linearly across the pixel width.
      x: ((r.timestamp.getTime() - minTs) / tsRange) * w,

      // Y: SVG coordinates increase downward, so we subtract from CHART_HEIGHT to flip
      // the axis. A value of VALUE_MIN lands at the bottom; VALUE_MAX lands at the top.
      // Math.max/min clamps outliers to the visible range before calculating position.
      y: CHART_HEIGHT - ((Math.max(VALUE_MIN, Math.min(VALUE_MAX, r.valueMgDl)) - VALUE_MIN) / (VALUE_MAX - VALUE_MIN)) * CHART_HEIGHT,

      // Keep a reference to the original reading so the tooltip can show full details.
      reading: r,
    }));
  });

  constructor() {
    // afterNextRender defers DOM access until after the first render completes.
    // This is the zoneless equivalent of ngAfterViewInit and is safe for ResizeObserver setup.
    afterNextRender(() => {
      this.resizeObserver = new ResizeObserver(entries => {
        const w = entries[0].contentRect.width;
        // Ignore zero width (e.g. while the element is hidden) to avoid a degenerate chart.
        if (w > 0) this.containerWidth.set(w);
      });
      // Watch the host element. Any time its width changes, containerWidth updates and
      // displayPoints recomputes automatically because it reads containerWidth().
      this.resizeObserver.observe(this.hostRef.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  // Formats a mg/dL value for display. When the user has chosen mmol/L the value is
  // divided by the conversion factor and shown with one decimal place; otherwise it is
  // rounded to a whole number.
  displayVal(reading: { valueMgDl: number }): string {
    if (this.displayUnit() === UNIT_MMOL) {
      return (reading.valueMgDl / MMOL_TO_MGDL).toFixed(1);
    }
    return Math.round(reading.valueMgDl).toString();
  }

  // Called on every mousemove event over the SVG. Finds the chart point whose X
  // coordinate is closest to the cursor and sets it as the hovered point so the
  // tooltip component can display its details.
  onMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    // getBoundingClientRect gives the element's position in the viewport, so subtracting
    // rect.left converts the absolute clientX into a position relative to the chart.
    const rect = target.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    const points = this.displayPoints();
    if (points.length === 0) {
      this.hoveredPoint.set(null);
      return;
    }

    // Linear scan to find the nearest point by horizontal distance only.
    let closest = points[0];
    let minDist = Math.abs(points[0].x - mouseX);
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(points[i].x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closest = points[i];
      }
    }
    this.hoveredPoint.set(closest);
  }

  // Clear the tooltip when the mouse leaves the chart area.
  onMouseLeave(): void {
    this.hoveredPoint.set(null);
  }
}
