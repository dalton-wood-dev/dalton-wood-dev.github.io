import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-download-icon',
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"
      stroke-linecap="round" stroke-linejoin="round" focusable="false">
      <path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5" />
    </svg>
  `,
  styles: `
    :host { display: inline-flex; width: 1em; height: 1em; flex-shrink: 0; }
    svg { width: 100%; height: 100%; }
  `,
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadIcon {}
