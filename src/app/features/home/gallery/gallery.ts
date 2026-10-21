import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PHOTOS } from '../portfolio.data';
import { SectionHeading } from '../../../shared/section-heading';

@Component({
  selector: 'app-gallery',
  imports: [SectionHeading],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gallery {
  readonly photos = PHOTOS;
}
