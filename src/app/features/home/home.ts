import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from './hero/hero';
import { About } from './about/about';
import { Gallery } from './gallery/gallery';
import { Projects } from './projects/projects';
import { Contact } from './contact/contact';
import { SiteHeader } from './site-header/site-header';
import { PROFILE } from './portfolio.data';

@Component({
  selector: 'app-home',
  imports: [Hero, About, Gallery, Projects, Contact, SiteHeader],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  readonly profile = PROFILE;
}
