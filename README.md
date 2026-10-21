# Dalton Wood — Developer Portfolio

An Angular portfolio with a black-and-lime visual system, an animated CSS prism, selected Angular and Java/Spring Boot projects, and a native contact form.

## Local development

Use Node 22.12 or later in the 22.x release line (the current local setup uses 22.16.0), or another Node version supported by Angular 21.

```powershell
npm.cmd ci
npm.cmd start -- --open
```

On Windows, `npm.cmd` works when PowerShell blocks the `npm.ps1` wrapper. The preview runs at `http://localhost:4200`.

## Validation

```powershell
npm.cmd run check
npm.cmd test -- --watch=false
npm.cmd run build
```

The check command runs Angular's compiler, including strict template checking. The production build also validates bundle budgets. GitHub Actions builds and deploys the production output to GitHub Pages when changes are pushed to `main`.

## Editing the portfolio

- `src/app/features/home/portfolio.data.ts`: profile links, résumé path, project descriptions, technologies, and personal photos.
- `src/styles.scss`: shared design tokens, typography, layout helpers, buttons, and accessibility styles.
- `src/app/shared/section-heading.*`: shared section heading component.
- `src/app/features/home/`: hero, projects, about, gallery, contact, and navigation components.
- `public/projects/salon.png`: screenshot captured from the real Salon demo. Refresh it when that project changes.
- `src/index.html`: page title, search description, social metadata, and font loading.

The inventory and NetScan workflow visuals are illustrations, not screenshots of deployed apps. Project status should stay accurate as the work evolves. Add technical decisions, tests, and demonstrated results when they can be supported by the project.

## Behavior and accessibility

Content remains visible without animation. The hero uses one scoped GSAP sequence with cleanup and respects reduced-motion preferences. A downward scroll of at least 24 pixels starts opposing rotations and a seam flash, running at their own pace and holding the readable final pose. Upward scrolling reverses the sequence. Playback pauses when less than 55% of the panel is visible below the header, or the browser tab is hidden. The glow starts about 10 degrees before the faces finish aligning, then flashes, holds, and fades. Fine mouse pointers gently tilt the whole prism assembly independently of its opening rotation. Touch devices use orientation-based tilt when supported, requesting permission through Enable tilt when needed. Reduced-motion users have no follow effect. There is no pinning or scroll scrubbing. Reduced-motion mode shows a static, front-facing name. Photos use a compact grid and a keyboard-accessible horizontal strip on narrow screens. Navigation uses native anchors and indicates the visible section.

Contact uses native validation and the existing FormSubmit AJAX endpoint. Inline status reports sending, provider acceptance, and failures; drafts stay in place. Direct email provides a fallback. Automated checks mock the endpoint and never submit real messages. Verify inbox delivery manually before relying on it for enquiries.

## Browser regression checks

With the local Angular preview running and a dedicated Chrome instance exposing remote debugging on port 9224, run `npm.cmd run check:browser` using Node 22. The checks open review tabs and verify mocked form requests, duplicate protection, sensor permission granted/denied, reduced motion, responsive layouts, internal links, and scroll playback/reversal. Sensor behavior still needs physical-device testing over HTTPS.

Local fonts and their licenses are in `public/fonts/`. Responsive WebP photos are in `public/photos/`; the originals remain available. Canonical URL, social metadata, robots, and sitemap use `https://dalton-wood.dev/`. The sharing image is `public/social-preview.png`.

## Hosting

The Angular workspace retains its existing internal project name, `new-portfolio`, so production artifacts remain at `dist/new-portfolio/browser`, as expected by the deployment workflow. No hosting or domain settings are changed by this refactor.
