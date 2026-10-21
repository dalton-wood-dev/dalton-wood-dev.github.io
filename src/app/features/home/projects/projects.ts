import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SectionHeading } from '../../../shared/section-heading';
import { PROJECTS } from '../portfolio.data';

@Component({
  selector: 'app-projects',
  imports: [SectionHeading],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Projects {
  readonly projects = PROJECTS;
}
