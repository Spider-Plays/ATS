import React from "react";
import { copyrightNotice } from "../../config/branding";
import { StitchLogo } from "../branding/StitchLogo";
import "@/styles/portal-theme.css";

export type PortalTheme = "candidate" | "referral" | "vendor";

export type PortalAuthHighlight = {
  icon: string;
  text: string;
};

type PortalAuthShellProps = {
  theme: PortalTheme;
  portalLabel: string;
  heroTitle: string;
  heroHighlights: readonly PortalAuthHighlight[];
  mobileHeroText: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function PortalAuthShell({
  theme,
  portalLabel,
  heroTitle,
  heroHighlights,
  mobileHeroText,
  title,
  subtitle,
  children,
  footer,
}: PortalAuthShellProps) {
  return (
    <div data-portal-theme={theme} className="min-h-screen flex login-page-bg">
      <div className="login-hero-panel hidden lg:flex lg:w-[46%] relative overflow-hidden flex-col justify-between p-12 text-white">
        <div
          className="login-hero-grid absolute inset-0 opacity-60 pointer-events-none"
          aria-hidden
        />
        <div className="relative z-10">
          <StitchLogo tone="inverse" size="lg" onDark subtitle={portalLabel} />
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <span className="login-hero-badge">{portalLabel}</span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            {heroTitle}
          </h1>
          <ul className="space-y-4 text-white/85 text-sm font-medium">
            {heroHighlights.map((item) => (
              <li key={item.text} className="flex gap-3">
                <span className="login-hero-icon-chip material-symbols-outlined text-[18px] shrink-0">
                  {item.icon}
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          {copyrightNotice()}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="login-hero-panel lg:hidden relative overflow-hidden rounded-2xl p-6 mb-2 text-white">
            <div
              className="login-hero-grid absolute inset-0 opacity-40 pointer-events-none"
              aria-hidden
            />
            <div className="relative z-10 flex flex-col items-center text-center gap-3">
              <StitchLogo
                tone="inverse"
                size="lg"
                onDark
                subtitle={portalLabel}
              />
              <p className="text-sm text-white/80 max-w-xs">{mobileHeroText}</p>
            </div>
          </div>

          <div className="login-panel-accent space-y-6">
            <div>
              <h2 className="text-page-title">{title}</h2>
              <p className="text-page-desc mt-2">{subtitle}</p>
            </div>
            {children}
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
