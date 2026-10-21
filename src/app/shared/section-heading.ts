import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-section-heading',
  templateUrl: './section-heading.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeading {
  readonly number = input.required<string>();
  readonly title = input.required<string>();
  readonly headingId = input.required<string>();
  readonly description = input('');
}
