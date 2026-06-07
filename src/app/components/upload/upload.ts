import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CsvParserService } from '../../services/csv-parser.service';
import { GlucoseDataService } from '../../services/glucose-data.service';

@Component({
  selector: 'bst-upload',
  templateUrl: './upload.html',
  styleUrl: './upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Upload {
  private readonly parser = inject(CsvParserService);
  private readonly dataService = inject(GlucoseDataService);

  readonly isDragging = signal(false);
  readonly errors = signal<string[]>([]);
  readonly isLoading = this.dataService.isLoading;

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) await this.processFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) await this.processFile(file);
  }

  private async processFile(file: File): Promise<void> {
    this.errors.set([]);
    this.dataService.isLoading.set(true);
    try {
      const result = await this.parser.parseFile(file);
      if (result.errors.length > 0) {
        this.errors.set(result.errors.map(e => e.row >= 0 ? `Row ${e.row}: ${e.message}` : e.message));
      }
      this.dataService.loadSession(result);
    } finally {
      this.dataService.isLoading.set(false);
    }
  }
}
