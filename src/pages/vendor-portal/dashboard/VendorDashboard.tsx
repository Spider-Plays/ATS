import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  candidateStatusClass,
  candidateStatusLabel,
  isTerminalStatus,
} from "@/pages/candidates/_shared/candidate.utils";
import type { CandidateStatus } from "@/types";
import clsx from "clsx";
import { format } from "date-fns";
import "./dashboard.css";

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

const STATUS_BAR_COLORS: Partial<Record<CandidateStatus, string>> = {
  ADDED: "#94a3b8",
  SUBMITTED: "#64748b",
  SCREENING: "#f59e0b",
  SHORTLISTED: "#d97706",
  INTERVIEW: "#a855f7",
  OFFER: "#3b82f6",
  HIRED: "#10b981",
  REJECTED: "#ef4444",
};

const VendorDashboard = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-portal-me"],
    queryFn: api.vendorPortal.getMe,
  });

  const metrics = useMemo(() => {
    if (!data) return null;
    const { stats } = data;
    const total = stats.totalSubmissions;
    const breakdown = stats.statusBreakdown;

    let inPipeline = 0;
    let hired = 0;
    let rejected = 0;

    for (const row of breakdown) {
      const status = row.status as CandidateStatus;
      if (status === "HIRED") hired += row.count;
      else if (status === "REJECTED") rejected += row.count;
      else if (!isTerminalStatus(status)) inPipeline += row.count;
    }

    const successRate = total > 0 ? Math.round((hired / total) * 100) : 0;

    const segments = breakdown
      .map((row) => ({
        status: row.status as CandidateStatus,
        label: candidateStatusLabel(row.status as CandidateStatus),
        count: row.count,
        pct: total > 0 ? (row.count / total) * 100 : 0,
        color: STATUS_BAR_COLORS[row.status as CandidateStatus] ?? "#94a3b8",
      }))
      .sort((a, b) => b.count - a.count);

    return { total, inPipeline, hired, rejected, successRate, segments };
  }, [data]);

  if (isLoading) {
    return (
      <div className="vendor-home-loading">
        <div className="vendor-home-loading__spinner" aria-hidden />
        <p className="text-sm font-medium">Loading your portal…</p>
      </div>
    );
  }

  if (!data || !metrics) {
    return (
      <div className="max-w-lg mx-auto p-12 text-center">
        <p className="text-slate-600">
          Unable to load vendor account. Contact your HR administrator.
        </p>
      </div>
    );
  }

  const { vendor, stats, recentSubmissions } = data;
  const firstName = data.user.name.split(" ")[0];

  return (
    <div className="vendor-home">
      {/* Hero */}
      <section className="portal-dash-hero vendor-home-hero">
        <div className="vendor-home-hero__grid">
          <div className="vendor-home-hero__main">
            <div className="vendor-home-hero__profile">
              <UserAvatar
                name={data.user.name}
                avatar={user?.avatar}
                size="lg"
                className="portal-dash-hero__avatar"
              />
              <div className="min-w-0">
                <p className="portal-dash-hero__eyebrow">{timeGreeting()}</p>
                <h1 className="portal-dash-hero__title">Hello, {firstName}</h1>
                <div className="vendor-home-hero__org">
                  <Sparkles size={14} aria-hidden />
                  <span>{vendor.name}</span>
                  {vendor.code && (
                    <span className="vendor-home-hero__code">{vendor.code}</span>
                  )}
                </div>
              </div>
            </div>
            <p className="vendor-home-hero__tagline">
              Submit top talent, track pipeline progress, and grow placements
              across your assigned roles.
            </p>
          </div>

          <div className="vendor-home-hero__stats">
            <div className="vendor-home-stat-pill">
              <Briefcase size={16} />
              <span className="vendor-home-stat-pill__value">
                {stats.assignedJobs}
              </span>
              <span className="vendor-home-stat-pill__label">Open jobs</span>
            </div>
            <div className="vendor-home-stat-pill">
              <Users size={16} />
              <span className="vendor-home-stat-pill__value">
                {stats.totalSubmissions}
              </span>
              <span className="vendor-home-stat-pill__label">Profiles</span>
            </div>
            <div className="vendor-home-stat-pill vendor-home-stat-pill--accent">
              <TrendingUp size={16} />
              <span className="vendor-home-stat-pill__value">
                {metrics.inPipeline}
              </span>
              <span className="vendor-home-stat-pill__label">In pipeline</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bento grid */}
      <div className="vendor-home-bento">
        {/* Pipeline overview */}
        <section className="app-card vendor-home-card vendor-home-card--pipeline">
          <div className="vendor-home-card__head">
            <div>
              <p className="vendor-home-card__eyebrow">Pipeline snapshot</p>
              <h2 className="vendor-home-card__title">Submission health</h2>
            </div>
            <Link to="/vendor-portal/report" className="vendor-home-card__link">
              Full report <ArrowRight size={14} />
            </Link>
          </div>

          {metrics.total === 0 ? (
            <div className="vendor-home-empty">
              <div className="vendor-home-empty__icon">
                <BarChart3 size={28} />
              </div>
              <p className="vendor-home-empty__title">No data yet</p>
              <p className="vendor-home-empty__text">
                Submit your first candidate to see pipeline analytics here.
              </p>
              <Link
                to="/vendor-portal/positions"
                className="vendor-home-empty__cta"
              >
                Browse assigned jobs
              </Link>
            </div>
          ) : (
            <>
              <div className="vendor-pipeline-bar" role="img" aria-label="Submission status distribution">
                {metrics.segments.map((seg) =>
                  seg.pct > 0 ? (
                    <div
                      key={seg.status}
                      className="vendor-pipeline-bar__seg"
                      style={{
                        width: `${seg.pct}%`,
                        backgroundColor: seg.color,
                      }}
                      title={`${seg.label}: ${seg.count}`}
                    />
                  ) : null,
                )}
              </div>

              <div className="vendor-pipeline-legend">
                {metrics.segments.map((seg) => (
                  <div key={seg.status} className="vendor-pipeline-legend__item">
                    <span
                      className="vendor-pipeline-legend__dot"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="vendor-pipeline-legend__label">
                      {seg.label}
                    </span>
                    <span className="vendor-pipeline-legend__count">
                      {seg.count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="vendor-pipeline-metrics">
                <div className="vendor-pipeline-metric">
                  <span className="vendor-pipeline-metric__value">
                    {metrics.inPipeline}
                  </span>
                  <span className="vendor-pipeline-metric__label">Active</span>
                </div>
                <div className="vendor-pipeline-metric vendor-pipeline-metric--success">
                  <span className="vendor-pipeline-metric__value">
                    {metrics.hired}
                  </span>
                  <span className="vendor-pipeline-metric__label">Hired</span>
                </div>
                <div className="vendor-pipeline-metric vendor-pipeline-metric--muted">
                  <span className="vendor-pipeline-metric__value">
                    {metrics.rejected}
                  </span>
                  <span className="vendor-pipeline-metric__label">Rejected</span>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Success ring */}
        <section className="app-card vendor-home-card vendor-home-card--ring">
          <p className="vendor-home-card__eyebrow">Performance</p>
          <h2 className="vendor-home-card__title">Placement rate</h2>

          <div className="vendor-success-ring">
            <svg viewBox="0 0 120 120" className="vendor-success-ring__svg">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="vendor-success-ring__track"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(metrics.successRate / 100) * 327} 327`}
                transform="rotate(-90 60 60)"
                className="vendor-success-ring__fill"
              />
            </svg>
            <div className="vendor-success-ring__center">
              <span className="vendor-success-ring__value">
                {metrics.successRate}%
              </span>
              <span className="vendor-success-ring__label">Hired</span>
            </div>
          </div>

          <p className="vendor-success-ring__caption">
            {metrics.hired} of {metrics.total} profiles placed successfully
          </p>
        </section>

        {/* Activity feed */}
        <section className="app-card vendor-home-card vendor-home-card--feed">
          <div className="vendor-home-card__head">
            <div>
              <p className="vendor-home-card__eyebrow">Live feed</p>
              <h2 className="vendor-home-card__title">Recent submissions</h2>
            </div>
            <Link
              to="/vendor-portal/submissions"
              className="vendor-home-card__link"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="vendor-home-empty vendor-home-empty--compact">
              <p className="vendor-home-empty__text">
                No submissions yet — pick a job and add your first profile.
              </p>
            </div>
          ) : (
            <ul className="vendor-feed">
              {recentSubmissions.map((s) => {
                const status = s.status as CandidateStatus;
                return (
                  <li key={s.id}>
                    <Link
                      to={`/vendor-portal/submissions/${s.id}`}
                      className="vendor-feed-row"
                    >
                      <div
                        className={clsx(
                          "vendor-feed-row__avatar",
                          `vendor-feed-row__avatar--${status.toLowerCase()}`,
                        )}
                      >
                        {initials(s.name)}
                      </div>
                      <div className="vendor-feed-row__body">
                        <p className="vendor-feed-row__name">{s.name}</p>
                        <p className="vendor-feed-row__meta">
                          {s.jobTitle ?? "—"}
                          {s.jobCode ? ` · ${s.jobCode}` : ""}
                        </p>
                      </div>
                      <div className="vendor-feed-row__right">
                        <span
                          className={clsx(
                            "vendor-feed-row__badge",
                            candidateStatusClass(status),
                          )}
                        >
                          {candidateStatusLabel(status)}
                        </span>
                        {s.createdAt && (
                          <span className="vendor-feed-row__date">
                            {format(new Date(s.createdAt), "MMM d")}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Quick actions */}
        <section className="app-card vendor-home-card vendor-home-card--actions">
          <p className="vendor-home-card__eyebrow">Shortcuts</p>
          <h2 className="vendor-home-card__title">Quick actions</h2>

          <div className="vendor-actions">
            <Link
              to="/vendor-portal/positions"
              className="vendor-action-tile vendor-action-tile--jobs"
            >
              <Briefcase size={22} />
              <span className="vendor-action-tile__label">Assigned jobs</span>
              <span className="vendor-action-tile__hint">
                {stats.assignedJobs} open
              </span>
            </Link>
            <Link
              to="/vendor-portal/positions"
              className="vendor-action-tile vendor-action-tile--submit"
            >
              <UserPlus size={22} />
              <span className="vendor-action-tile__label">Submit profile</span>
              <span className="vendor-action-tile__hint">Add candidate</span>
            </Link>
            <Link
              to="/vendor-portal/submissions"
              className="vendor-action-tile vendor-action-tile--profiles"
            >
              <Users size={22} />
              <span className="vendor-action-tile__label">My profiles</span>
              <span className="vendor-action-tile__hint">
                {stats.totalSubmissions} total
              </span>
            </Link>
            <Link
              to="/vendor-portal/report"
              className="vendor-action-tile vendor-action-tile--report"
            >
              <BarChart3 size={22} />
              <span className="vendor-action-tile__label">Report</span>
              <span className="vendor-action-tile__hint">Status breakdown</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VendorDashboard;
