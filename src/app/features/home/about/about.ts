import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SectionHeading } from '../../../shared/section-heading';

@Component({
  selector: 'app-about',
  imports: [SectionHeading],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {}
