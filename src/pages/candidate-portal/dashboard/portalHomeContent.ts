import { APP_NAME } from "@/config/branding";

export type PortalNewsItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  excerpt: string;
};

export const PORTAL_HOME_ABOUT = {
  eyebrow: "Who we are",
  title: `Welcome to ${APP_NAME}`,
  paragraphs: [
    "We build hiring experiences that put people first — candidates, recruiters, and hiring teams alike.",
    "Our team spans product, engineering, and operations with a bias for ownership. We ship thoughtfully, learn from each other, and measure success by the impact we create for every person in the hiring journey.",
  ],
};

export const PORTAL_HOME_MISSION = {
  eyebrow: "What we do",
  title: "Making hiring more human",
  paragraphs: [
    "From the first application to the final offer, we help organizations run clear, respectful hiring processes — with timely updates, structured interviews, and transparent communication at every step.",
    "As a candidate in our portal, you get a single place to track your progress, prepare for interviews, and respond to offers without chasing email threads.",
  ],
};

export const PORTAL_HOME_VALUES = [
  {
    icon: "rocket_launch",
    title: "Ownership",
    description: "We take initiative, ship with care, and follow through.",
  },
  {
    icon: "groups",
    title: "Collaboration",
    description: "We work openly across teams and respect every perspective.",
  },
  {
    icon: "favorite",
    title: "Impact",
    description: "We focus on outcomes that improve real hiring experiences.",
  },
];

export const PORTAL_HOME_NEWS: PortalNewsItem[] = [
  {
    id: "q2-hiring",
    date: "June 2026",
    category: "Company update",
    title: "Q2 hiring highlights",
    excerpt:
      "We welcomed new teammates across engineering and operations — thank you to everyone who referred great talent.",
  },
  {
    id: "portal-launch",
    date: "May 2026",
    category: "Product",
    title: "Candidate portal refresh",
    excerpt:
      "A redesigned home experience with clearer application tracking, interview schedules, and offer management.",
  },
  {
    id: "culture-series",
    date: "April 2026",
    category: "Culture",
    title: "Inside our team culture series",
    excerpt:
      "Monthly spotlights on how we collaborate, give feedback, and support growth — starting with our engineering guild.",
  },
];
