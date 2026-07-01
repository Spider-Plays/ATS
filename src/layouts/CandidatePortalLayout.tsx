import React from "react";
import { CandidatePortalSidebar } from "../components/portal/CandidatePortalSidebar";
import { AnimatedOutlet } from "../components/motion/AnimatedOutlet";
import "@/styles/portal-theme.css";
import "@/pages/candidate-portal/dashboard/dashboard.css";
import "@/styles/portal-pages.css";

const CandidatePortalLayout = () => (
  <div className="min-h-screen app-shell-bg" data-portal-theme="candidate">
    <CandidatePortalSidebar />
    <main className="app-main-canvas ml-[var(--sidebar-width)] min-h-screen p-6 md:p-8 custom-scrollbar overflow-y-auto">
      <AnimatedOutlet />
    </main>
  </div>
);

export default CandidatePortalLayout;
