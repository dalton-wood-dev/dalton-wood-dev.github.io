import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { gsap } from 'gsap';
import { PROFILE } from '../portfolio.data';
import { DownloadIcon } from '../../../shared/download-icon';

@Component({
  selector: 'app-hero',
  imports: [DownloadIcon],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  readonly profile = PROFILE;
  readonly reducedMotion = signal(false);
  readonly motionOverride = signal(false);
  readonly motionDisabled = signal(false);
  private refreshMotion: () => void = () => {};
  private requestLighting: () => void = () => {};
  readonly tiltState = signal<'hidden' | 'ready' | 'requesting' | 'active' | 'denied'>('hidden');
  enableTilt: () => Promise<void> = async () => {};
  centerTilt: () => void = () => {};
  private readonly scene = viewChild.required<ElementRef<HTMLElement>>('scene');
  private readonly rig = viewChild.required<ElementRef<HTMLElement>>('rig');
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      // Nonvisual environments can render the content without motion APIs.
      if (typeof window.matchMedia !== 'function' ||
          typeof IntersectionObserver === 'undefined' ||
          typeof DOMMatrix === 'undefined' || typeof DOMPoint === 'undefined') return;
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion.set(preference.matches);
      const cleanupLighting = this.setupLighting();
      let cleanup = this.setupAnimation();
      this.requestLighting();
      this.refreshMotion = () => {
        cleanup();
        cleanup = this.setupAnimation();
        this.requestLighting();
      };
      const onPreferenceChange = () => {
        this.reducedMotion.set(preference.matches);
        this.motionOverride.set(false);
        this.motionDisabled.set(false);
        this.refreshMotion();
      };
      preference.addEventListener('change', onPreferenceChange);
      this.destroyRef.onDestroy(() => {
        preference.removeEventListener('change', onPreferenceChange);
        cleanup();
        cleanupLighting();
      });
    });
  }

  async toggleMotion(): Promise<void> {
    if (this.tiltState() === 'requesting') return;
    const enable = !this.motionOverride();
    this.motionOverride.set(enable);
    this.motionDisabled.set(!enable);
    this.refreshMotion();
    // Keep the sensor request in the original click's user-activation context.
    if (enable && this.tiltState() === 'ready') await this.enableTilt();
  }

  private setupAnimation(): () => void {
    if (this.motionDisabled()) return () => {};
    if (typeof window.matchMedia !== 'function') return () => {};
    const scene = this.scene().nativeElement;
    const media = gsap.matchMedia();

    const preferenceQuery = this.motionOverride() ? '' : ' and (prefers-reduced-motion: no-preference)';
    media.add(this.motionOverride() ? 'all' : '(prefers-reduced-motion: no-preference)', () => {
      const rotationDuration = 3.2;
      // At 80% of the eased turn, the faces are about 10 degrees from the front.
      const glowStart = rotationDuration * 0.8;
      const flashStart = rotationDuration + 0.05;
      const expansionDuration = flashStart - glowStart + 0.16;
      const timeline = gsap.timeline({ paused: true, onUpdate: () => this.requestLighting() });
      timeline.fromTo('.prism-top',
        { rotateY: 45, opacity: 1 },
        { rotateY: 360, duration: rotationDuration, ease: 'power2.inOut' }, 0)
        .fromTo('.prism-bottom',
          { rotateY: -45, opacity: 1 },
          { rotateY: -360, duration: rotationDuration, ease: 'power2.inOut' }, 0)
        .fromTo('.prism-light',
          { scaleX: 0, scaleY: 0.35 },
          { scaleX: 1.4, scaleY: 1, duration: expansionDuration, ease: 'sine.out' }, glowStart)
        // Brightness peaks separately so the outward expansion never stops and restarts.
        .fromTo('.prism-light',
          { opacity: 0 },
          { opacity: 1, duration: expansionDuration, ease: 'power2.in' }, glowStart)
        // Let the peak linger before the light slowly recedes into the seam.
        .to('.prism-light',
          { opacity: 0, scaleX: 1.5, scaleY: 0.25, duration: 1.1, ease: 'power1.inOut' }, flashStart + 0.56);

      const directionThreshold = 24;
      let direction: -1 | 0 | 1 = 0;
      let lastScroll = window.scrollY;
      let travel = 0;
      let frame = 0;

      const update = () => {
        frame = 0;
        const position = Math.max(0, window.scrollY);
        const delta = position - lastScroll;
        lastScroll = position;

        // Accumulate deliberate movement, rather than responding to trackpad jitter.
        if (delta > 0) travel = Math.max(0, travel) + delta;
        if (delta < 0) travel = Math.min(0, travel) + delta;
        if (travel >= directionThreshold) direction = 1;
        if (travel <= -directionThreshold) direction = -1;

        const bounds = scene.getBoundingClientRect();
        const headerBottom =
          document.querySelector('app-site-header')?.getBoundingClientRect().bottom ?? 0;
        const visibleHeight = Math.max(
          0,
          Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, headerBottom),
        );
        const availableHeight = Math.min(bounds.height, window.innerHeight - headerBottom);
        const visible = availableHeight > 0 && visibleHeight / availableHeight >= 0.55;

        if (!visible || document.hidden || direction === 0) {
          timeline.pause();
        } else if (direction === 1) {
          timeline.play();
        } else {
          timeline.reverse();
        }
      };

      const scheduleUpdate = () => {
        if (!frame) frame = window.requestAnimationFrame(update);
      };
      const onVisibilityChange = () => {
        if (document.hidden) timeline.pause();
        else scheduleUpdate();
      };
      const observer = new IntersectionObserver(scheduleUpdate, {
        threshold: [0, 0.5, 0.6, 1],
      });
      observer.observe(scene);
      window.addEventListener('scroll', scheduleUpdate, { passive: true });
      window.addEventListener('resize', scheduleUpdate);
      document.addEventListener('visibilitychange', onVisibilityChange);
      update();

      return () => {
        window.cancelAnimationFrame(frame);
        observer.disconnect();
        window.removeEventListener('scroll', scheduleUpdate);
        window.removeEventListener('resize', scheduleUpdate);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        for (const element of scene.querySelectorAll<HTMLElement>('.prism, .prism-light')) {
          element.style.removeProperty('transform');
          element.style.removeProperty('opacity');
        }
      };
    }, scene);

    media.add('(hover: hover) and (pointer: fine)' + preferenceQuery,
      () => this.setupPointerFollow(scene, this.rig().nativeElement));

    media.add('(hover: none) and (pointer: coarse)' + preferenceQuery,
      () => this.setupDeviceTilt(scene, this.rig().nativeElement));

    return () => media.revert();
  }

  private setupLighting(): () => void {
    const scene = this.scene().nativeElement;
    const rig = this.rig().nativeElement;
    const prisms = [...scene.querySelectorAll<HTMLElement>('.prism')].map(element => ({
      element,
      faces: [...element.querySelectorAll<HTMLElement>('.face')],
    }));
    // A fixed, soft light above and left of the viewer. CSS coordinates point down.
    const length = Math.hypot(-0.55, -0.7, 0.8);
    const light = new DOMPoint(-0.55 / length, -0.7 / length, 0.8 / length, 0);
    const halfLength = Math.hypot(light.x, light.y, light.z + 1);
    const half = new DOMPoint(light.x / halfLength, light.y / halfLength, (light.z + 1) / halfLength, 0);
    const dot = (a: DOMPoint, b: DOMPoint) => a.x * b.x + a.y * b.y + a.z * b.z;
    const richSurface = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const paintInterval = richSurface ? 0 : 1000 / 30;
    let visible = true;
    let frame = 0;
    let timer = 0;
    let lastPaint = -Infinity;
    let previousTransforms = '';
    const setMaterial = (element: HTMLElement, property: string, value: string) => {
      if (element.style.getPropertyValue(property) !== value) element.style.setProperty(property, value);
    };
    const shade = (normal: DOMPoint, right: DOMPoint, down: DOMPoint) => {
      const diffuse = Math.max(0, dot(normal, light));
      const intensity = 0.27 + 0.73 * diffuse;
      const color = (offset: number) => `rgb(${[47, 56, 39].map(channel => Math.round(channel * intensity + offset)).join(' ')})`;
      const sheen = (0.14 * Math.pow(Math.max(0, dot(normal, half)), 10)).toFixed(4);
      // Move a broad reflection through each face's local surface coordinates.
      const sheenX = (50 + dot(right, light) * 65).toFixed(2);
      const sheenY = (40 + dot(down, light) * 50).toFixed(2);
      return {
        fill: richSurface
          ? `radial-gradient(ellipse 100% 65% at ${sheenX}% ${sheenY}%, rgb(219 235 207 / ${sheen}), transparent 75%), linear-gradient(110deg, transparent 10%, rgb(170 190 155 / 0.025) 42%, transparent 85%), linear-gradient(140deg, ${color(2)}, ${color(-2)})`
          : `linear-gradient(140deg, ${color(2)}, ${color(-2)})`,
        edge: `rgb(${[78, 91, 61].map(channel => Math.round(channel * (0.45 + 0.55 * diffuse))).join(' ')})`,
      };
    };
    const paint = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      lastPaint = performance.now();
      const rigTransform = getComputedStyle(rig).transform;
      const transforms = prisms.map(({ element }) => getComputedStyle(element).transform);
      const signature = [rigTransform, ...transforms].join('|');
      if (signature === previousTransforms) return;
      previousTransforms = signature;
      const rigMatrix = new DOMMatrix(rigTransform);
      for (const [prismIndex, { element, faces }] of prisms.entries()) {
        const world = rigMatrix.multiply(new DOMMatrix(transforms[prismIndex]));
        faces.forEach((face, index) => {
          const angle = index * Math.PI / 2;
          const material = shade(
            world.transformPoint(new DOMPoint(Math.sin(angle), 0, Math.cos(angle), 0)),
            world.transformPoint(new DOMPoint(Math.cos(angle), 0, -Math.sin(angle), 0)),
            world.transformPoint(new DOMPoint(0, 1, 0, 0)),
          );
          setMaterial(face, '--face-fill', material.fill);
          setMaterial(face, '--face-edge', material.edge);
        });
        for (const [name, direction] of [['top', -1], ['bottom', 1]] as const) {
          const material = shade(
            world.transformPoint(new DOMPoint(0, direction, 0, 0)),
            world.transformPoint(new DOMPoint(1, 0, 0, 0)),
            world.transformPoint(new DOMPoint(0, 0, -direction, 0)),
          );
          setMaterial(element, `--cap-${name}-fill`, material.fill);
          setMaterial(element, `--cap-${name}-edge`, material.edge);
        }
      }
    };
    this.requestLighting = () => {
      if (!visible || document.hidden || frame || timer) return;
      const delay = paintInterval - (performance.now() - lastPaint);
      if (delay > 0) {
        timer = window.setTimeout(() => {
          timer = 0;
          if (visible && !document.hidden) frame = requestAnimationFrame(paint);
        }, delay);
      } else frame = requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) this.requestLighting();
    });
    observer.observe(scene);
    const onVisibility = () => this.requestLighting();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      this.requestLighting = () => {};
      for (const { element, faces } of prisms) {
        for (const face of faces) {
          face.style.removeProperty('--face-fill');
          face.style.removeProperty('--face-edge');
        }
        for (const name of ['top', 'bottom']) {
          element.style.removeProperty(`--cap-${name}-fill`);
          element.style.removeProperty(`--cap-${name}-edge`);
        }
      }
    };
  }

  private setupDeviceTilt(scene: HTMLElement, rig: HTMLElement): () => void {
    if (!window.isSecureContext || typeof DeviceOrientationEvent === 'undefined') return () => {};
    const orientation = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };
    gsap.set(rig, { rotationX: 0, rotationY: 0, x: 0, y: 0 });
    const options = { duration: 0.3, ease: 'sine.out', onUpdate: () => this.requestLighting() };
    const rotateX = gsap.quickTo(rig, 'rotationX', options);
    const rotateY = gsap.quickTo(rig, 'rotationY', options);
    type Vector = { x: number; y: number; z: number };
    let baseline: { horizontal: Vector; vertical: Vector } | undefined;
    const dot = (a: Vector, b: Vector) => a.x * b.x + a.y * b.y + a.z * b.z;
    let visible = false;
    let disposed = false;
    let listening = false;
    const reset = () => {
      baseline = undefined;
      rotateX(0); rotateY(0);
    };
    this.centerTilt = reset;
    // Ignore small variations in the phone's neutral holding position.
    const normalize = (projection: number) => {
      const degrees = Math.asin(gsap.utils.clamp(-1, 1, projection)) * 180 / Math.PI;
      return gsap.utils.clamp(-1, 1, Math.sign(degrees) * Math.max(0, Math.abs(degrees) - 2) / 23);
    };
    const onTilt = (event: DeviceOrientationEvent) => {
      if (!visible || document.hidden || event.beta === null || event.gamma === null) return;
      if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
      const angle = (window.screen.orientation?.angle ?? 0) * Math.PI / 180;
      const beta = event.beta * Math.PI / 180;
      const gamma = event.gamma * Math.PI / 180;
      // Project world vertical into device coordinates. Unlike subtracting
      // Euler angles, this stays continuous across their representation changes.
      const deviceX = -Math.cos(beta) * Math.sin(gamma);
      const deviceY = Math.sin(beta);
      const gravity: Vector = {
        x: deviceX * Math.cos(angle) + deviceY * Math.sin(angle),
        y: deviceY * Math.cos(angle) - deviceX * Math.sin(angle),
        z: Math.cos(beta) * Math.cos(gamma),
      };
      if (!baseline) {
        const length = Math.hypot(gravity.y, gravity.z);
        // Wait for a usable holding position if the phone is exactly on its side.
        if (length < 0.05) return;
        const vertical = { x: 0, y: gravity.z / length, z: -gravity.y / length };
        const horizontal = {
          x: length,
          y: -gravity.x * gravity.y / length,
          z: -gravity.x * gravity.z / length,
        };
        baseline = { horizontal, vertical };
      }
      const horizontal = normalize(-dot(gravity, baseline.horizontal));
      const vertical = normalize(dot(gravity, baseline.vertical));
      rotateX(-vertical * 17.5);
      rotateY(horizontal * 30);
    };
    const start = () => {
      if (disposed || listening) return;
      listening = true;
      window.addEventListener('deviceorientation', onTilt, { passive: true });
      this.tiltState.set('active');
    };
    this.enableTilt = async () => {
      this.tiltState.set('requesting');
      try {
        const permission = await orientation.requestPermission?.();
        if (disposed) return;
        if (permission === 'granted') start();
        else this.tiltState.set('denied');
      } catch {
        if (!disposed) this.tiltState.set('denied');
      }
    };
    if (orientation.requestPermission) this.tiltState.set('ready');
    else start();
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (!visible) reset();
    });
    observer.observe(scene);
    window.addEventListener('orientationchange', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener('deviceorientation', onTilt);
      window.removeEventListener('orientationchange', reset);
      document.removeEventListener('visibilitychange', reset);
      for (const tween of [rotateX, rotateY]) tween.tween.kill();
      this.tiltState.set('hidden');
      this.enableTilt = async () => {};
      this.centerTilt = () => {};
      rig.style.removeProperty('transform');
    };
  }

  private setupPointerFollow(scene: HTMLElement, rig: HTMLElement): () => void {
    const options = { duration: 0.65, ease: 'power3.out', onUpdate: () => this.requestLighting() };
    const rotateX = gsap.quickTo(rig, 'rotationX', options);
    const rotateY = gsap.quickTo(rig, 'rotationY', options);
    const moveX = gsap.quickTo(rig, 'x', options);
    const moveY = gsap.quickTo(rig, 'y', options);
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let visible = true;

    const follow = () => {
      frame = 0;
      rotateX(-2 - pointerY * 12.8);
      rotateY(-3 + pointerX * 15.4);
      moveX(pointerX * 13.4);
      moveY(pointerY * 12.8);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !visible || document.hidden) return;
      pointerX = gsap.utils.clamp(-1, 1, event.clientX / window.innerWidth * 2 - 1);
      pointerY = gsap.utils.clamp(-1, 1, event.clientY / window.innerHeight * 2 - 1);
      if (!frame) frame = window.requestAnimationFrame(follow);
    };
    const reset = () => {
      window.cancelAnimationFrame(frame);
      pointerX = pointerY = 0;
      follow();
    };
    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) reset();
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (!visible) reset();
    });
    observer.observe(scene);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerout', onPointerOut);
    window.addEventListener('blur', reset);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('blur', reset);
      rig.style.removeProperty('transform');
    };
  }
}
