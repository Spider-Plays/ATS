import React from "react";
import { PortalAuthShell } from "./PortalAuthShell";

const PORTAL_HIGHLIGHTS = [
  {
    icon: "business",
    text: "Learn about our team, values, and company updates in your portal home",
  },
  {
    icon: "check_circle",
    text: "Browse open roles and apply with one profile",
  },
  {
    icon: "check_circle",
    text: "Track application status from screening to offer",
  },
  { icon: "check_circle", text: "See interview schedules and offer details" },
] as const;

type CandidateAuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function CandidateAuthShell({
  title,
  subtitle,
  children,
  footer,
}: CandidateAuthShellProps) {
  return (
    <PortalAuthShell
      theme="candidate"
      portalLabel="Candidate portal"
      heroTitle="Your hiring journey, in one place."
      heroHighlights={PORTAL_HIGHLIGHTS}
      mobileHeroText="Explore who we are, browse roles, and manage your application in one place."
      title={title}
      subtitle={subtitle}
      footer={footer}
    >
      {children}
    </PortalAuthShell>
  );
}
