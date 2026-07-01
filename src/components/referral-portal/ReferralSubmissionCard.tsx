import { Link } from "react-router-dom";
import { format } from "date-fns";
import clsx from "clsx";
import {
  Briefcase,
  ChevronRight,
  Gift,
  Hash,
  Heart,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  User,
} from "lucide-react";
import {
  candidateStatusClass,
  candidateStatusLabel,
} from "@/pages/candidates/_shared/candidate.utils";
import { statusDisplayLabel } from "@/lib/portalWorkflow";
import type { CandidateStatus } from "@/types";
import "@/components/vendor/VendorSubmissionCard.css";

export type ReferralSubmissionSummary = {
  id: string;
  name: string;
  email: string;
  status: string;
  jobTitle?: string | null;
  jobCode?: string | null;
  requirementId?: string | null;
  matchScore?: number;
  phone?: string | null;
  location?: string | null;
  referralRelationship?: string | null;
  bonusAmount?: number;
  createdAt?: string;
};

type ReferralSubmissionCardProps = {
  referral: ReferralSubmissionSummary;
  linkTo?: string;
};

const MATCH_RING_R = 28;
const MATCH_RING_C = 2 * Math.PI * MATCH_RING_R;

function MatchRing({ score }: { score: number }) {
  const dash = `${(score / 100) * MATCH_RING_C} ${MATCH_RING_C}`;

  return (
    <div className="vendor-sub-card__ring" aria-label={`Match score ${score}%`}>
      <svg viewBox="0 0 72 72" className="vendor-sub-card__ring-svg">
        <circle
          cx="36"
          cy="36"
          r={MATCH_RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="vendor-sub-card__ring-track"
        />
        <circle
          cx="36"
          cy="36"
          r={MATCH_RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={dash}
          transform="rotate(-90 36 36)"
          className="vendor-sub-card__ring-fill"
        />
      </svg>
      <div className="vendor-sub-card__ring-center">
        <span className="vendor-sub-card__ring-value">{score}%</span>
        <span className="vendor-sub-card__ring-label">Match</span>
      </div>
    </div>
  );
}

export function ReferralSubmissionCard({
  referral,
  linkTo,
}: ReferralSubmissionCardProps) {
  const status = referral.status as CandidateStatus;
  const href = linkTo ?? `/referral-portal/referrals/${referral.id}`;
  const matchScore = referral.matchScore ?? 0;

  return (
    <Link to={href} className="vendor-sub-card app-card">
      <div className="vendor-sub-card__main">
        <div className="vendor-sub-card__left">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                candidateStatusClass(status),
              )}
            >
              {candidateStatusLabel(status)}
            </span>
            {referral.jobCode && (
              <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Hash size={12} /> {referral.jobCode}
              </p>
            )}
          </div>
          <h2 className="vendor-sub-card__name">
            <User size={18} className="text-primary shrink-0" />
            {referral.name}
          </h2>
          <p className="vendor-sub-card__line">
            <Mail size={14} />
            {referral.email}
          </p>
          {referral.jobTitle && (
            <p className="vendor-sub-card__line">
              <Briefcase size={14} />
              {referral.jobTitle}
            </p>
          )}
          {referral.referralRelationship && (
            <p className="vendor-sub-card__line">
              <Heart size={14} />
              {referral.referralRelationship}
            </p>
          )}
          <div className="vendor-sub-card__chips">
            {referral.phone && (
              <span className="vendor-sub-card__chip">
                <Phone size={12} />
                {referral.phone}
              </span>
            )}
            {referral.location && (
              <span className="vendor-sub-card__chip">
                <MapPin size={12} />
                {referral.location}
              </span>
            )}
          </div>
          <p className="vendor-sub-card__date">
            Referred{" "}
            {referral.createdAt
              ? `${format(new Date(referral.createdAt), "PPP")} · ${format(new Date(referral.createdAt), "HH:mm")}`
              : "—"}
          </p>
          <div className="vendor-sub-card__action-card">
            <span className="vendor-sub-card__cta">
              View referral
              <ChevronRight size={16} />
            </span>
          </div>
        </div>

        <aside className="vendor-sub-card__aside">
          <div className="vendor-sub-card__stat-card">
            <p className="vendor-sub-card__stat-label">
              <TrendingUp size={13} />
              Role fit
            </p>
            {matchScore > 0 ? (
              <MatchRing score={matchScore} />
            ) : (
              <div className="vendor-sub-card__stat-empty">No score yet</div>
            )}
          </div>

          <div className="vendor-sub-card__stat-card">
            <p className="vendor-sub-card__stat-label">Pipeline</p>
            <span
              className={clsx(
                "vendor-sub-card__stage-badge",
                candidateStatusClass(status),
              )}
            >
              {statusDisplayLabel(status)}
            </span>
            {referral.bonusAmount ? (
              <div className="portal-bonus-pill mt-3 justify-center">
                <Gift size={12} className="text-tertiary" />
                <span className="portal-bonus-text text-[10px]">
                  ₹{referral.bonusAmount.toLocaleString("en-IN")}
                </span>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </Link>
  );
}
