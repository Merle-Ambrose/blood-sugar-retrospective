import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UNIT_MGDL, UNIT_MMOL } from '../../models/glucose.models';
import { GlucoseDataService } from '../../services/glucose-data.service';

@Component({
  selector: 'bst-unit-toggle',
  templateUrl: './unit-toggle.html',
  styleUrl: './unit-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitToggle {
  private readonly dataService = inject(GlucoseDataService);
  readonly displayUnit = this.dataService.displayUnit;
  protected readonly UNIT_MGDL = UNIT_MGDL;
  protected readonly UNIT_MMOL = UNIT_MMOL;

  toggle(): void {
    this.dataService.setDisplayUnit(this.displayUnit() === UNIT_MGDL ? UNIT_MMOL : UNIT_MGDL);
  }
}
