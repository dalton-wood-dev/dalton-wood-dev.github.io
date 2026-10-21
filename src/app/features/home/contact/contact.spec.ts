import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Contact } from './contact';

describe('Contact', () => {
  let component: Contact;
  let fixture: ComponentFixture<Contact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Contact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  afterEach(() => vi.unstubAllGlobals());

  function prepareSubmission(): { event: Event; form: HTMLFormElement } {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    (form.elements.namedItem('name') as HTMLInputElement).value = 'Test visitor';
    (form.elements.namedItem('email') as HTMLInputElement).value = 'visitor@example.com';
    (form.elements.namedItem('message') as HTMLTextAreaElement).value = 'A test message';
    return { form, event: { preventDefault: vi.fn(), currentTarget: form } as unknown as Event };
  }

  it('confirms provider acceptance and preserves the draft', async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: 'true' }) });
    vi.stubGlobal('fetch', request);
    const { form, event } = prepareSubmission();
    await component.submit(event);
    expect(component.submission()).toBe('success');
    expect((form.elements.namedItem('message') as HTMLTextAreaElement).value).toBe('A test message');
    expect(request.mock.calls[0][0]).toContain('formsubmit.co/ajax/');
  });

  it('shows failure for rejected or unconfirmed submissions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: 'false' }) }));
    await component.submit(prepareSubmission().event);
    expect(component.submission()).toBe('error');
  });

  it('prevents duplicate requests while sending', async () => {
    let complete!: (value: unknown) => void;
    const request = vi.fn().mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    vi.stubGlobal('fetch', request);
    const { event } = prepareSubmission();
    const pending = component.submit(event);
    await component.submit(event);
    expect(request).toHaveBeenCalledTimes(1);
    complete({ ok: true, json: async () => ({ success: true }) });
    await pending;
  });

  it('retains a draft when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Offline')));
    const { event, form } = prepareSubmission();
    await component.submit(event);
    expect(component.submission()).toBe('error');
    expect((form.elements.namedItem('email') as HTMLInputElement).value).toBe('visitor@example.com');
  });

});
