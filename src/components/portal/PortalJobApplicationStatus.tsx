import { Link } from "react-router-dom";
import { format } from "date-fns";
import { AlertCircle, ArrowRight } from "lucide-react";
import clsx from "clsx";
import { PortalPipelineTracker } from "./PortalPipelineTracker";
import {
  portalJobStatusLabel,
  resolvePortalJobStatus,
} from "@/lib/portalApplicationStatus";
import { statusDisplayLabel } from "@/lib/portalWorkflow";
import type { CandidateStatus } from "@/types";
import type { PortalApplication } from "@/services/http/portal";

type PortalJobApplicationStatusProps = {
  application: PortalApplication;
  variant?: "igs" | "default";
};

export function PortalJobApplicationStatus({
  application,
  variant = "default",
}: PortalJobApplicationStatusProps) {
  const isIgs = variant === "igs";
  const pipelineStatus = application.pipelineStatus as CandidateStatus;
  const jobStatus =
    application.portalJobStatus ??
    resolvePortalJobStatus(
      application.requirementStatus,
      application.listedOnPortal,
      application.pipelineStatus,
    );
  const isClosed = jobStatus === "CLOSED";
  const stageLabel = statusDisplayLabel(pipelineStatus);

  return (
    <section
      className={clsx(
        "space-y-4",
        isIgs
          ? "igs-job-application-status"
          : "rounded-xl border border-slate-200 bg-slate-50 p-5",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p
            className={clsx(
              "text-xs font-bold uppercase tracking-wider",
              isIgs ? "igs-job-detail-section__title" : "text-slate-400",
            )}
          >
            Your application
          </p>
          <p
            className={clsx(
              "text-lg font-bold",
              isIgs ? "text-[#0a1628]" : "text-slate-900",
            )}
          >
            {isClosed ? portalJobStatusLabel(jobStatus) : stageLabel}
          </p>
          <p
            className={clsx(
              "text-sm",
              isIgs ? "text-[#5c6578]" : "text-slate-600",
            )}
          >
            Applied {format(new Date(application.appliedAt), "PPP")}
            {application.matchScore > 0 &&
              ` · Match ${application.matchScore}%`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {application.isCurrent && !isClosed && (
            <span
              className={clsx(
                isIgs
                  ? "igs-job-application-status__badge igs-job-application-status__badge--current"
                  : "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary-container text-on-primary-container",
              )}
            >
              Current application
            </span>
          )}
          <span
            className={clsx(
              isIgs
                ? clsx(
                    "igs-job-application-status__badge",
                    isClosed
                      ? "igs-job-application-status__badge--closed"
                      : "igs-job-application-status__badge--active",
                  )
                : clsx(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    isClosed
                      ? "bg-slate-200 text-slate-700"
                      : "bg-teal-100 text-teal-800",
                  ),
            )}
          >
            {portalJobStatusLabel(jobStatus)}
          </span>
        </div>
      </div>

      {isClosed && application.closedReason && (
        <p
          className={clsx(
            "flex items-start gap-2 text-sm rounded-lg px-3 py-2",
            isIgs
              ? "igs-job-application-status__notice"
              : "bg-white border border-slate-200 text-slate-700",
          )}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {application.closedReason}
        </p>
      )}

      {!isClosed && pipelineStatus !== "REJECTED" && (
        <div className="space-y-2">
          <p
            className={clsx(
              "text-[10px] font-bold uppercase tracking-wider",
              isIgs ? "igs-job-detail-meta__label" : "text-slate-400",
            )}
          >
            Progress
          </p>
          <PortalPipelineTracker status={pipelineStatus} compact />
        </div>
      )}

      {pipelineStatus === "REJECTED" && !isClosed && (
        <p
          className={clsx(
            "text-sm",
            isIgs ? "text-[#5c6578]" : "text-slate-600",
          )}
        >
          Your application was not progressed further at this time. Thank you
          for your interest.
        </p>
      )}

      <Link
        to={`/candidate/jobs/applied/${application.requirementId}`}
        className={clsx(
          "inline-flex items-center gap-1.5 text-sm font-bold",
          isIgs ? "igs-link" : "text-primary hover:underline",
        )}
      >
        View application updates
        <ArrowRight size={16} aria-hidden />
      </Link>
    </section>
  );
}
