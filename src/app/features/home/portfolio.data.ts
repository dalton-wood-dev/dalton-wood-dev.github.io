export const PROFILE = {
  name: 'Dalton Wood',
  role: 'Software engineering student',
  email: 'wood.dalton27@gmail.com',
  github: 'https://github.com/dalton-wood-dev',
  linkedin: 'https://www.linkedin.com/in/dalton-wood-6243a6148',
  resume: 'woodResume_2026_5M.pdf',
  contactAction: 'https://formsubmit.co/c587513dc6673123eb58c8f6740c6a68',
} as const;

export const NAVIGATION = [
  { id: 'expApp', label: 'Projects' },
  { id: 'aboutApp', label: 'About' },
  { id: 'contactApp', label: 'Contact' },
] as const;

export interface Project {
  readonly id: string;
  readonly number: string;
  readonly name: string;
  readonly category: string;
  readonly status: string;
  readonly summary: string;
  readonly contribution: string;
  readonly stack: readonly string[];
  readonly href: string;
  readonly linkLabel: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly workflow?: {
    readonly title: string;
    readonly caption: string;
    readonly steps: readonly { readonly title: string; readonly description: string }[];
  };
}

export const PROJECTS: readonly Project[] = [
  {
    id: 'salon',
    number: '01',
    name: 'The Salon',
    category: 'Front-end development',
    status: 'In development · Live preview',
    summary: 'An Angular website that introduces a salon, its services, and its people.',
    contribution: 'Built the salon landing page and navigation in Angular, with separate destinations for services and booking. This independent project is still in development.',
    stack: ['Angular', 'TypeScript', 'SCSS'],
    href: 'https://dalton-wood.dev/my-salon/',
    linkLabel: 'Explore live demo',
    image: 'projects/salon.png',
    imageAlt: 'The Salon live demo, with its pink welcome section and salon interior photograph.',
  },
  {
    id: 'inventory',
    number: '02',
    name: 'Java Inventory App',
    category: 'Back-end development',
    status: 'Source available · No hosted demo',
    summary: 'A Java/Spring Boot inventory application organized around recipe-based assembly.',
    contribution: 'Refactored a course assessment into a recipe-based assembly workflow, extending the original project beyond its assessment requirements.',
    stack: ['Java', 'Spring Boot'],
    href: 'https://github.com/dalton-wood-dev/spring-inventory-management',
    linkLabel: 'Read the source',
    workflow: {
      title: 'Recipe-based assembly',
      caption: 'Workflow illustration · Java / Spring Boot',
      steps: [
        { title: 'Inventory', description: 'Available components' },
        { title: 'Recipe', description: 'Assembly requirements' },
        { title: 'Assembly', description: 'A finished product' },
      ],
    },
  },
  {
    id: 'netscan',
    number: '03',
    name: 'NetScan',
    category: 'Networking & back-end development',
    status: 'Source available · No hosted demo',
    summary: 'A Java/Spring Boot network scanner that discovers reachable hosts within a target subnet.',
    contribution: 'Built CIDR validation, concurrent host-reachability checks, and persisted scan results with staged, running, and completed states.',
    stack: ['Java', 'Spring Boot', 'Apache Commons Net'],
    href: 'https://github.com/dalton-wood-dev/netscan',
    linkLabel: 'Read the source',
    workflow: {
      title: 'Network discovery',
      caption: 'Workflow illustration · Java / Spring Boot',
      steps: [
        { title: 'CIDR target', description: 'Validate the subnet' },
        { title: 'Host discovery', description: 'Concurrent reachability checks' },
        { title: 'Scan results', description: 'Store reachable hosts' },
      ],
    },
  },
];

export const PHOTOS = [
  { src: 'fam.avif', label: 'My people', alt: 'Two people and a dog together in a truck.', width: 375, height: 281 },
  { src: 'beach.avif', label: 'Good company', alt: 'A group of friends together on the beach.', width: 375, height: 281 },
  { src: 'mountain2.avif', label: 'Open air', alt: 'A mountain skyline beneath an open sky.', width: 375, height: 281 },
  { src: 'dog2.avif', label: 'The co-pilot', alt: 'A dog wearing sunglasses.', width: 375, height: 500 },
] as const;
