import React from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Calendar,
  ChevronRight,
  FileText,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import { api } from "@/services/api";
import { ApiError } from "@/lib/apiClient";
import { BackButton } from "@/components/ui/BackButton";
import { PortalPipelineTracker } from "@/components/portal/PortalPipelineTracker";
import {
  candidateStatusClass,
  candidateStatusLabel,
  isHighMatch,
} from "@/pages/candidates/_shared/candidate.utils";
import {
  candidateInitials,
  matchScoreBarClass,
  matchScoreTone,
} from "@/pages/candidates/profile/profile.utils";
import type { CandidateStatus } from "@/types";
import { format } from "date-fns";
import { VendorSubmissionProfileView } from "./VendorSubmissionProfileView";
import { VendorSubmissionEditForm } from "./VendorSubmissionEditForm";
import "./detail.css";

const VendorSubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.get("edit") === "1";

  const { data: candidate, isLoading, isError, error } = useQuery({
    queryKey: ["vendor-portal-submission", id],
    queryFn: () => api.vendorPortal.getSubmission(id!),
    enabled: !!id,
  });

  const openEdit = () => {
    navigate(`/vendor-portal/submissions/${id}?edit=1`, { replace: true });
  };

  const closeEdit = () => {
    navigate(`/vendor-portal/submissions/${id}`, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center text-muted-foreground">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (isError || !candidate) {
    return (
      <div className="max-w-lg mx-auto p-12 text-center space-y-4">
        <p className="text-red-600 font-medium">
          {error instanceof ApiError ? error.message : "Profile not found"}
        </p>
        <BackButton fallback="/vendor-portal/submissions" label="Back" variant="muted" />
      </div>
    );
  }

  const status = candidate.status as CandidateStatus;
  const score = candidate.matchScore ?? 0;
  const strongMatch = isHighMatch(candidate);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-slide-up">
      <BackButton
        fallback="/vendor-portal/submissions"
        label="All profiles"
        variant="muted"
      />

      <header className="app-card overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
            <div className="flex gap-4 md:gap-5 min-w-0 flex-1">
              <div className="shrink-0 size-16 md:size-20 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                {candidateInitials(candidate.name)}
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge-eyebrow w-fit font-bold">
                    {isEditing ? "Edit profile" : "Candidate profile"}
                  </span>
                  <span
                    className={clsx(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                      candidateStatusClass(status),
                    )}
                  >
                    {candidateStatusLabel(status)}
                  </span>
                  {candidate.reqId && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                      <Hash size={12} />
                      {candidate.reqId}
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="text-page-title font-bold">{candidate.name}</h1>
                  <p className="text-page-desc mt-1">{candidate.email}</p>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {candidate.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={14} />
                      {candidate.phone}
                    </span>
                  )}
                  {candidate.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} />
                      {candidate.location}
                    </span>
                  )}
                  {candidate.createdAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} />
                      Submitted {format(new Date(candidate.createdAt), "PPP")} ·{" "}
                      {format(new Date(candidate.createdAt), "HH:mm")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={openEdit}
                  className="btn-filled !h-10 !px-5 !text-sm inline-flex items-center gap-2"
                >
                  <Pencil size={16} />
                  Edit profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeEdit}
                  className="btn-tonal !h-10 !px-5 !text-sm"
                >
                  Back to profile
                </button>
              )}
              {candidate.requirementId && (
                <Link
                  to={`/vendor-portal/positions/${candidate.requirementId}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 dark:bg-white/5 text-primary dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/10 dark:hover:bg-white/10"
                >
                  <Briefcase size={16} />
                  {candidate.jobTitle ?? candidate.role}
                  <ChevronRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <aside className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-6">
          <div
            className={clsx(
              "app-card p-5",
              strongMatch && "border-emerald-300/60 dark:border-emerald-500/40",
            )}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles
                size={18}
                className={
                  strongMatch ? "text-emerald-600 dark:text-emerald-400" : "text-primary/50"
                }
              />
              <h3 className="text-sm font-bold text-primary dark:text-white">Job match</h3>
            </div>
            <div className="flex items-end gap-4">
              <p
                className={clsx(
                  "text-4xl font-black tabular-nums leading-none",
                  matchScoreTone(score),
                )}
              >
                {score > 0 ? `${score}%` : "—"}
              </p>
              {score > 0 && (
                <div className="flex-1 pb-1">
                  <div className="h-2 rounded-full bg-primary/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className={clsx("h-full rounded-full transition-all", matchScoreBarClass(score))}
                      style={{ width: `${Math.min(100, score)}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-2">
                    {strongMatch ? "Strong fit for role" : "Based on profile & JD"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="app-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-primary dark:text-white">Pipeline</h3>
            <PortalPipelineTracker status={status} />
          </div>

          <div className="app-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-primary dark:text-white">Submission</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {candidate.jobTitle && (
                <li className="flex items-start gap-2">
                  <Briefcase size={14} className="shrink-0 mt-0.5" />
                  <span>{candidate.jobTitle}</span>
                </li>
              )}
              {candidate.email && (
                <li className="flex items-start gap-2">
                  <Mail size={14} className="shrink-0 mt-0.5" />
                  <span className="break-all">{candidate.email}</span>
                </li>
              )}
              {candidate.hasResume && (
                <li className="flex items-start gap-2">
                  <FileText size={14} className="shrink-0 mt-0.5" />
                  <span className="break-all">
                    {candidate.resumeFileName ?? "Resume on file"}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </aside>

        {isEditing ? (
          <VendorSubmissionEditForm
            candidateId={id!}
            candidate={candidate}
            onCancel={closeEdit}
            onSaved={closeEdit}
          />
        ) : (
          <VendorSubmissionProfileView candidate={candidate} />
        )}
      </div>
    </div>
  );
};

export default VendorSubmissionDetail;
