import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { SectionHeading } from '../../../shared/section-heading';
import { PROFILE } from '../portfolio.data';
import { DownloadIcon } from '../../../shared/download-icon';

@Component({
  selector: 'app-contact',
  imports: [SectionHeading, DownloadIcon],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  readonly profile = PROFILE;
  readonly submission = signal<'idle' | 'sending' | 'success' | 'error'>('idle');
  private readonly destroyRef = inject(DestroyRef);
  private controller?: AbortController;

  constructor() {
    this.destroyRef.onDestroy(() => this.controller?.abort());
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    if (this.submission() === 'sending' || !form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get('_honey')) return;
    this.submission.set('sending');
    const controller = this.controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(this.profile.contactAction.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(data.entries())),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || (result.success !== true && result.success !== 'true')) throw new Error('Submission failed');
      if (!this.destroyRef.destroyed) this.submission.set('success');
    } catch {
      if (!this.destroyRef.destroyed) this.submission.set('error');
    } finally {
      window.clearTimeout(timeout);
    }
  }
}
