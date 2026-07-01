import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  ChevronRight,
  FileText,
  Gift,
  Heart,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";
import { api } from "@/services/api";
import { BackButton } from "@/components/ui/BackButton";
import { PortalPipelineTracker } from "@/components/portal/PortalPipelineTracker";
import {
  candidateStatusClass,
  candidateStatusLabel,
} from "@/pages/candidates/_shared/candidate.utils";
import type { CandidateStatus } from "@/types";
import "@/pages/vendor-portal/submission-detail/detail.css";
import "./detail.css";

const ReferralDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["referral-portal-referral", id],
    queryFn: () => api.referralPortal.getReferral(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center text-slate-500">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-lg mx-auto p-12 text-center space-y-4">
        <p className="text-red-600 font-medium">Referral not found</p>
        <BackButton
          fallback="/referral-portal/referrals"
          label="All referrals"
          variant="muted"
        />
      </div>
    );
  }

  const {
    candidate,
    timeline,
    referralRelationship,
    referralNotes,
    referralBonusAmount,
  } = data;
  const status = candidate.status as CandidateStatus;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <BackButton
        fallback="/referral-portal/referrals"
        label="All referrals"
        variant="muted"
      />

      <header className="vendor-submission-detail__header">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="portal-page-eyebrow">Referral</span>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                candidateStatusClass(status),
              )}
            >
              {candidateStatusLabel(status)}
            </span>
          </div>
          <h1 className="text-page-title">{candidate.name}</h1>
          <p className="text-page-desc mt-1">{candidate.email}</p>
        </div>
        {candidate.requirementId && (
          <Link
            to={`/referral-portal/jobs/${candidate.requirementId}`}
            className="vendor-submission-detail__job-link"
          >
            <Briefcase size={16} />
            {candidate.jobTitle ?? candidate.role}
            {candidate.reqId ? ` · ${candidate.reqId}` : ""}
            <ChevronRight size={16} />
          </Link>
        )}
      </header>

      <div className="vendor-submission-detail__layout">
        <aside className="vendor-submission-detail__sidebar">
          <section className="vendor-submission-detail__panel">
            <p className="vendor-submission-detail__panel-label">Match score</p>
            <div className="vendor-submission-detail__match">
              <span className="vendor-submission-detail__match-value">
                {candidate.matchScore != null && candidate.matchScore > 0
                  ? `${Math.round(candidate.matchScore)}%`
                  : "—"}
              </span>
              <span className="vendor-submission-detail__match-label">
                Role fit
              </span>
            </div>
          </section>

          <section className="vendor-submission-detail__panel">
            <p className="vendor-submission-detail__panel-label">Pipeline</p>
            <PortalPipelineTracker status={status} compact />
          </section>

          <section className="vendor-submission-detail__panel">
            <p className="vendor-submission-detail__panel-label">Details</p>
            <ul className="vendor-submission-detail__meta">
              {referralRelationship && (
                <li className="flex items-center gap-1.5">
                  <Heart size={14} /> {referralRelationship}
                </li>
              )}
              {candidate.createdAt && (
                <li>
                  Referred {format(new Date(candidate.createdAt), "PPP")}
                </li>
              )}
              {candidate.phone && (
                <li className="flex items-center gap-1.5">
                  <Phone size={14} /> {candidate.phone}
                </li>
              )}
              {candidate.location && (
                <li className="flex items-center gap-1.5">
                  <MapPin size={14} /> {candidate.location}
                </li>
              )}
              {candidate.hasResume && (
                <li className="flex items-center gap-1.5">
                  <FileText size={14} />
                  {candidate.resumeFileName ?? "Resume on file"}
                </li>
              )}
              {referralBonusAmount ? (
                <li className="flex items-center gap-1.5 text-tertiary font-bold">
                  <Gift size={14} />₹
                  {referralBonusAmount.toLocaleString("en-IN")} bonus on hire
                </li>
              ) : null}
            </ul>
          </section>
        </aside>

        <div className="space-y-6">
          {referralNotes && (
            <section className="vendor-submission-detail__section">
              <h2 className="vendor-submission-detail__section-title">
                Your notes
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {referralNotes}
              </p>
            </section>
          )}

          <section className="vendor-submission-detail__section">
            <h2 className="vendor-submission-detail__section-title">
              Contact
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-[10px] font-bold uppercase text-muted-foreground">
                  Email
                </dt>
                <dd className="font-medium flex items-center gap-1.5 mt-1">
                  <Mail size={14} className="text-muted-foreground" />
                  {candidate.email}
                </dd>
              </div>
              {candidate.phone && (
                <div>
                  <dt className="text-[10px] font-bold uppercase text-muted-foreground">
                    Phone
                  </dt>
                  <dd className="font-medium mt-1">{candidate.phone}</dd>
                </div>
              )}
              {candidate.location && (
                <div>
                  <dt className="text-[10px] font-bold uppercase text-muted-foreground">
                    Location
                  </dt>
                  <dd className="font-medium mt-1">{candidate.location}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="vendor-submission-detail__section">
            <h2 className="vendor-submission-detail__section-title">
              Activity timeline
            </h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity logged yet.
              </p>
            ) : (
              <ul className="referral-detail-timeline">
                {timeline.map((ev, i) => (
                  <li key={`${ev.timestamp}-${i}`} className="referral-detail-timeline__item">
                    <p className="referral-detail-timeline__time">
                      {format(new Date(ev.timestamp), "PPP p")}
                    </p>
                    <p className="referral-detail-timeline__action">
                      {ev.action.replace(/_/g, " ")}
                    </p>
                    {ev.performerName && (
                      <p className="referral-detail-timeline__performer">
                        by {ev.performerName}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReferralDetail;
