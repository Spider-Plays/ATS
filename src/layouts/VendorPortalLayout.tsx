import React from "react";
import VendorSidebar from "../components/VendorSidebar";
import { AnimatedOutlet } from "../components/motion/AnimatedOutlet";
import "@/styles/portal-theme.css";

const VendorPortalLayout = () => (
  <div className="min-h-screen app-shell-bg" data-portal-theme="vendor">
    <VendorSidebar />
    <main className="app-main-canvas flex-1 ml-[var(--sidebar-width)] p-6 md:p-8 min-h-screen custom-scrollbar">
      <AnimatedOutlet />
    </main>
  </div>
);

export default VendorPortalLayout;
