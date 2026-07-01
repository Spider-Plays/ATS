import React from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SidebarBrand } from "./layout/SidebarBrand";
import { SidebarNavItem, SidebarSectionLabel } from "./layout/SidebarNavItem";
import { SidebarProfileFooter } from "./layout/SidebarProfileFooter";
import { api } from "@/services/api";

const ReferralSidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  const { data: me } = useQuery({
    queryKey: ["referral-portal-me"],
    queryFn: api.referralPortal.getMe,
  });

  const referralCount = me?.stats.totalReferrals ?? 0;

  return (
    <aside className="m3-navigation-drawer flex flex-col fixed left-0 top-0 z-50">
      <SidebarBrand
        subtitle="Referral portal"
        homeTo="/referral-portal/dashboard"
      />

      <nav className="sidebar-nav custom-scrollbar">
        <SidebarSectionLabel>Menu</SidebarSectionLabel>
        <SidebarNavItem
          to="/referral-portal/dashboard"
          icon="dashboard"
          label="Home"
          active={path === "/referral-portal/dashboard"}
        />
        <SidebarNavItem
          to="/referral-portal/jobs"
          icon="work"
          label="Open roles"
          active={path.startsWith("/referral-portal/jobs")}
        />
        <SidebarNavItem
          to="/referral-portal/referrals"
          icon="group"
          label="My referrals"
          active={
            path.startsWith("/referral-portal/referrals") &&
            !path.startsWith("/referral-portal/jobs")
          }
          badge={referralCount > 0 ? referralCount : undefined}
        />
        <SidebarNavItem
          to="/referral-portal/program"
          icon="card_giftcard"
          label="Rewards program"
          active={path === "/referral-portal/program"}
        />
      </nav>

      <SidebarProfileFooter />
    </aside>
  );
};

export default ReferralSidebar;
