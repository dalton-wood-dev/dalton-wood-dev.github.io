import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NAVIGATION, PROFILE } from '../portfolio.data';
import { DownloadIcon } from '../../../shared/download-icon';

@Component({
  selector: 'app-site-header',
  imports: [DownloadIcon],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader implements AfterViewInit {
  readonly profile = PROFILE;
  readonly links = NAVIGATION;
  readonly activeSection = signal('');
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    const visibleSections = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visibleSections.add(entry.target);
        else visibleSections.delete(entry.target);
      }
      const current = [...visibleSections].sort((a, b) =>
        a.getBoundingClientRect().top - b.getBoundingClientRect().top
      )[0];
      this.activeSection.set(current?.id ?? '');
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    for (const link of this.links) {
      const section = document.getElementById(link.id);
      if (section) observer.observe(section);
    }
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
