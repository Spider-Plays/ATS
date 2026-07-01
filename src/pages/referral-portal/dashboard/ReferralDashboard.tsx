import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Check,
  Copy,
  Gift,
  Sparkles,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  referralStatusBadgeClass,
  referralStatusLabel,
} from "@/lib/referralStatus";
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

const STATUS_BAR_COLORS: Record<string, string> = {
  ADDED: "#94a3b8",
  SUBMITTED: "#64748b",
  SCREENING: "#f59e0b",
  SHORTLISTED: "#d97706",
  INTERVIEW: "#a855f7",
  OFFER: "#3b82f6",
  TO_BE_OFFERED: "#3b82f6",
  OFFERED: "#3b82f6",
  HIRED: "#10b981",
  REJECTED: "#ef4444",
};

const ReferralDashboard = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["referral-portal-me"],
    queryFn: api.referralPortal.getMe,
  });

  const metrics = useMemo(() => {
    if (!data) return null;
    const { stats } = data;
    const total = stats.totalReferrals;
    const breakdown = stats.statusBreakdown;

    const segments = breakdown
      .map((row) => ({
        status: row.status,
        label: referralStatusLabel(row.status),
        count: row.count,
        pct: total > 0 ? (row.count / total) * 100 : 0,
        color: STATUS_BAR_COLORS[row.status] ?? "#94a3b8",
      }))
      .sort((a, b) => b.count - a.count);

    const successRate =
      total > 0 ? Math.round((stats.hired / total) * 100) : 0;

    return {
      total,
      inPipeline: stats.inPipeline,
      hired: stats.hired,
      rejected: stats.rejected,
      successRate,
      segments,
    };
  }, [data]);

  const copyCode = async () => {
    if (!data?.referralCode) return;
    await navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="referral-home-loading">
        <div className="referral-home-loading__spinner" aria-hidden />
        <p className="text-sm font-medium">Loading your portal…</p>
      </div>
    );
  }

  if (!data || !metrics) {
    return (
      <div className="max-w-lg mx-auto p-12 text-center">
        <p className="text-slate-600">
          Unable to load your referral account. Contact HR.
        </p>
      </div>
    );
  }

  const { user: portalUser, stats, recentReferrals, referralCode } = data;
  const firstName = portalUser.name.split(" ")[0];

  return (
    <div className="referral-home">
      <section className="portal-dash-hero referral-home-hero">
        <div className="referral-home-hero__grid">
          <div className="referral-home-hero__main">
            <div className="referral-home-hero__profile">
              <UserAvatar
                name={portalUser.name}
                avatar={user?.avatar}
                size="lg"
                className="portal-dash-hero__avatar"
              />
              <div className="min-w-0">
                <p className="portal-dash-hero__eyebrow">{timeGreeting()}</p>
                <h1 className="portal-dash-hero__title">Hello, {firstName}</h1>
                {portalUser.department && (
                  <div className="referral-home-hero__dept">
                    <Sparkles size={14} aria-hidden />
                    <span>{portalUser.department}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="referral-home-hero__tagline">
              Refer great talent, track every step to hire, and earn bonuses when
              your referrals join the team.
            </p>
          </div>

          <div className="referral-home-hero__aside">
            <div className="referral-home-code">
              <p className="referral-home-code__label">Your referral code</p>
              <div className="referral-home-code__row">
                <p className="referral-home-code__value">{referralCode}</p>
                <button
                  type="button"
                  onClick={copyCode}
                  className="referral-home-code__copy"
                  title="Copy code"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="referral-home-hero__stats">
              <div className="referral-home-stat-pill">
                <Briefcase size={16} />
                <span className="referral-home-stat-pill__value">
                  {stats.openJobs}
                </span>
                <span className="referral-home-stat-pill__label">Open jobs</span>
              </div>
              <div className="referral-home-stat-pill">
                <Users size={16} />
                <span className="referral-home-stat-pill__value">
                  {stats.totalReferrals}
                </span>
                <span className="referral-home-stat-pill__label">Referrals</span>
              </div>
              <div className="referral-home-stat-pill referral-home-stat-pill--accent">
                <TrendingUp size={16} />
                <span className="referral-home-stat-pill__value">
                  {stats.inPipeline}
                </span>
                <span className="referral-home-stat-pill__label">
                  In pipeline
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="referral-home-bento">
        <section className="referral-home-card referral-home-card--pipeline">
          <div className="referral-home-card__head">
            <div>
              <p className="referral-home-card__eyebrow">Pipeline snapshot</p>
              <h2 className="referral-home-card__title">Referral health</h2>
            </div>
            <Link
              to="/referral-portal/referrals"
              className="referral-home-card__link"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {metrics.total === 0 ? (
            <div className="referral-home-empty">
              <div className="referral-home-empty__icon">
                <BarChart3 size={28} />
              </div>
              <p className="referral-home-empty__title">No referrals yet</p>
              <p className="referral-home-empty__text">
                Browse open roles and submit your first referral to see pipeline
                analytics here.
              </p>
              <Link
                to="/referral-portal/jobs"
                className="referral-home-empty__cta"
              >
                Browse open roles
              </Link>
            </div>
          ) : (
            <>
              <div
                className="referral-pipeline-bar"
                role="img"
                aria-label="Referral status distribution"
              >
                {metrics.segments.map((seg) =>
                  seg.pct > 0 ? (
                    <div
                      key={seg.status}
                      className="referral-pipeline-bar__seg"
                      style={{
                        width: `${seg.pct}%`,
                        backgroundColor: seg.color,
                      }}
                      title={`${seg.label}: ${seg.count}`}
                    />
                  ) : null,
                )}
              </div>

              <div className="referral-pipeline-legend">
                {metrics.segments.map((seg) => (
                  <div
                    key={seg.status}
                    className="referral-pipeline-legend__item"
                  >
                    <span
                      className="referral-pipeline-legend__dot"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="referral-pipeline-legend__label">
                      {seg.label}
                    </span>
                    <span className="referral-pipeline-legend__count">
                      {seg.count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="referral-pipeline-metrics">
                <div className="referral-pipeline-metric">
                  <span className="referral-pipeline-metric__value">
                    {metrics.inPipeline}
                  </span>
                  <span className="referral-pipeline-metric__label">Active</span>
                </div>
                <div className="referral-pipeline-metric referral-pipeline-metric--success">
                  <span className="referral-pipeline-metric__value">
                    {metrics.hired}
                  </span>
                  <span className="referral-pipeline-metric__label">Hired</span>
                </div>
                <div className="referral-pipeline-metric referral-pipeline-metric--muted">
                  <span className="referral-pipeline-metric__value">
                    {metrics.rejected}
                  </span>
                  <span className="referral-pipeline-metric__label">
                    Not selected
                  </span>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="referral-home-card referral-home-card--ring">
          <p className="referral-home-card__eyebrow">Performance</p>
          <h2 className="referral-home-card__title">Hire rate</h2>

          <div className="referral-success-ring">
            <svg viewBox="0 0 120 120" className="referral-success-ring__svg">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="referral-success-ring__track"
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
                className="referral-success-ring__fill"
              />
            </svg>
            <div className="referral-success-ring__center">
              <span className="referral-success-ring__value">
                {metrics.successRate}%
              </span>
              <span className="referral-success-ring__label">Hired</span>
            </div>
          </div>

          <p className="referral-success-ring__caption">
            {metrics.hired} of {metrics.total} referrals hired successfully
          </p>

          {stats.potentialBonus > 0 && (
            <div className="referral-bonus-earned">
              <Trophy size={16} />
              <span>
                ₹{stats.potentialBonus.toLocaleString("en-IN")} bonus earned
              </span>
            </div>
          )}
        </section>

        <section className="referral-home-card referral-home-card--feed">
          <div className="referral-home-card__head">
            <div>
              <p className="referral-home-card__eyebrow">Live feed</p>
              <h2 className="referral-home-card__title">Recent referrals</h2>
            </div>
            <Link
              to="/referral-portal/referrals"
              className="referral-home-card__link"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {recentReferrals.length === 0 ? (
            <div className="referral-home-empty referral-home-empty--compact">
              <p className="referral-home-empty__text">
                No referrals yet — pick a role and refer someone great.
              </p>
            </div>
          ) : (
            <ul className="referral-feed">
              {recentReferrals.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/referral-portal/referrals/${r.id}`}
                    className="referral-feed-row"
                  >
                    <div
                      className={clsx(
                        "referral-feed-row__avatar",
                        `referral-feed-row__avatar--${r.status.toLowerCase()}`,
                      )}
                    >
                      {initials(r.name)}
                    </div>
                    <div className="referral-feed-row__body">
                      <p className="referral-feed-row__name">{r.name}</p>
                      <p className="referral-feed-row__meta">
                        {r.jobTitle ?? "—"}
                        {r.jobCode ? ` · ${r.jobCode}` : ""}
                      </p>
                    </div>
                    <div className="referral-feed-row__right">
                      <span
                        className={clsx(
                          "referral-feed-row__badge",
                          referralStatusBadgeClass(r.status),
                        )}
                      >
                        {referralStatusLabel(r.status)}
                      </span>
                      {r.createdAt && (
                        <span className="referral-feed-row__date">
                          {format(new Date(r.createdAt), "MMM d")}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="referral-home-card referral-home-card--actions">
          <p className="referral-home-card__eyebrow">Shortcuts</p>
          <h2 className="referral-home-card__title">Quick actions</h2>

          <div className="referral-actions">
            <Link
              to="/referral-portal/jobs"
              className="referral-action-tile referral-action-tile--jobs"
            >
              <Briefcase size={22} />
              <span className="referral-action-tile__label">Open roles</span>
              <span className="referral-action-tile__hint">
                {stats.openJobs} available
              </span>
            </Link>
            <Link
              to="/referral-portal/jobs"
              className="referral-action-tile referral-action-tile--refer"
            >
              <UserPlus size={22} />
              <span className="referral-action-tile__label">Refer someone</span>
              <span className="referral-action-tile__hint">Submit profile</span>
            </Link>
            <Link
              to="/referral-portal/referrals"
              className="referral-action-tile referral-action-tile--referrals"
            >
              <Users size={22} />
              <span className="referral-action-tile__label">My referrals</span>
              <span className="referral-action-tile__hint">
                {stats.totalReferrals} total
              </span>
            </Link>
            <Link
              to="/referral-portal/program"
              className="referral-action-tile referral-action-tile--program"
            >
              <Gift size={22} />
              <span className="referral-action-tile__label">Rewards program</span>
              <span className="referral-action-tile__hint">Bonus details</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReferralDashboard;
