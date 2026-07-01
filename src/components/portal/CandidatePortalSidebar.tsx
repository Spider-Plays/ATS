import React from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { StitchLogo } from "../branding/StitchLogo";
import { Link } from "react-router-dom";
import { SidebarNavItem } from "../layout/SidebarNavItem";
import { SidebarProfileFooter } from "../layout/SidebarProfileFooter";
import { api } from "@/services/api";

const BASE_NAV = [
  { to: "/candidate/dashboard", icon: "dashboard", label: "Home" },
  { to: "/candidate/jobs", icon: "work", label: "Jobs" },
] as const;

export function CandidatePortalSidebar() {
  const location = useLocation();

  const { data: portalMe } = useQuery({
    queryKey: ["portal-me"],
    queryFn: api.portal.getMe,
  });

  const offers = portalMe?.linked === true ? (portalMe.offers ?? []) : [];
  const showOffersNav = offers.length > 0;
  const pendingOffers = offers.filter((o) => o.status === "SENT").length;

  const navItems = showOffersNav
    ? [
        ...BASE_NAV,
        { to: "/candidate/offers" as const, icon: "description", label: "Offer" },
      ]
    : BASE_NAV;

  return (
    <aside className="m3-navigation-drawer flex flex-col fixed left-0 top-0 z-50">
      <div className="sidebar-brand">
        <Link
          to="/candidate/dashboard"
          className="sidebar-brand-link rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <StitchLogo tone="primary" subtitle="Candidate portal" size="md" />
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const active =
            location.pathname === item.to ||
            (item.to === "/candidate/jobs" &&
              location.pathname.startsWith("/candidate/jobs")) ||
            (item.to === "/candidate/offers" &&
              location.pathname.startsWith("/candidate/offers"));

          return (
            <SidebarNavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={active}
              badge={item.to === "/candidate/offers" ? pendingOffers : undefined}
            />
          );
        })}
      </nav>

      <SidebarProfileFooter profileTo="/candidate/profile" />
    </aside>
  );
}
