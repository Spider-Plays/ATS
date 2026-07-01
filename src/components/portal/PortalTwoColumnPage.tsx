import React from "react";
import { BackButton } from "@/components/ui/BackButton";
import clsx from "clsx";

export type PortalPageHeroConfig = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
};

type PortalTwoColumnPageProps = {
  className?: string;
  back?: { fallback: string; label?: string };
  hero?: PortalPageHeroConfig | React.ReactNode;
  alert?: React.ReactNode;
  /** Primary column — company content on home, application detail on updates page, etc. */
  main?: React.ReactNode;
  /** Secondary column — hiring snapshot on home, offers/interviews on application page, etc. */
  sidebar?: React.ReactNode;
};

export function PortalPageHero({
  eyebrow,
  title,
  subtitle,
  badge,
  meta,
  actions,
}: PortalPageHeroConfig) {
  return (
    <section className="portal-page-hero">
      <div
        className={clsx(
          "portal-page-hero__inner",
          actions && "portal-page-hero__inner--with-actions",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="portal-page-hero__eyebrow">{eyebrow}</p>
          <h1 className="portal-page-hero__title">{title}</h1>
          {subtitle && (
            <p className="portal-page-hero__subtitle">{subtitle}</p>
          )}
          {meta && <div className="portal-page-hero__meta">{meta}</div>}
        </div>
        {(badge || actions) && (
          <div className="portal-page-hero__aside">
            {badge}
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}

function renderHero(hero: PortalTwoColumnPageProps["hero"]) {
  if (!hero) return null;
  if (React.isValidElement(hero)) return hero;
  return <PortalPageHero {...(hero as PortalPageHeroConfig)} />;
}

export function PortalTwoColumnPage({
  className,
  back,
  hero,
  alert,
  sidebar,
  main,
}: PortalTwoColumnPageProps) {
  const hasMain = main != null;
  const hasSidebar = sidebar != null;

  return (
    <div className={clsx("portal-page", className)}>
      {back && (
        <BackButton
          fallback={back.fallback}
          label={back.label ?? "Back"}
          variant="muted"
        />
      )}
      {renderHero(hero)}
      {alert}
      <div
        className={clsx(
          "portal-dash-grid",
          hasMain && hasSidebar && "portal-dash-grid--split",
          !hasMain && hasSidebar && "portal-dash-grid--single",
          hasMain && !hasSidebar && "portal-dash-grid--single",
        )}
      >
        {hasMain && <div className="portal-dash-stack">{main}</div>}
        {hasSidebar && <div className="portal-dash-stack">{sidebar}</div>}
      </div>
    </div>
  );
}

export function PortalPageLoading({ label }: { label: string }) {
  return (
    <div className="portal-page-loading">
      <div className="portal-dash-loading__spinner" aria-hidden />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function PortalPagePanel({
  title,
  icon,
  link,
  children,
  flush,
  id,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  link?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
  id?: string;
}) {
  return (
    <section className="portal-dash-panel" id={id}>
      <div className="portal-dash-panel__head">
        <h2 className="portal-dash-panel__title">
          {icon}
          {title}
        </h2>
        {link}
      </div>
      <div
        className={clsx(
          "portal-dash-panel__body",
          flush && "portal-dash-panel__body--flush",
        )}
      >
        {children}
      </div>
    </section>
  );
}
