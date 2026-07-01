import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import type { CandidateStatus } from "../../types";
import {
  PORTAL_PIPELINE_STEPS,
  pipelineStepIndex,
  isTerminalStatus,
} from "../../lib/portalWorkflow";
import "./portal-pipeline-tracker.css";

type PortalPipelineTrackerProps = {
  status: CandidateStatus;
  compact?: boolean;
};

function PipelineStepTooltip({
  label,
  description,
  state,
}: {
  label: string;
  description: string;
  state: "done" | "active" | "upcoming";
}) {
  const badgeLabel =
    state === "done"
      ? "Completed"
      : state === "active"
        ? "Current stage"
        : "Upcoming";

  return (
    <div className="portal-pipeline-step__tooltip" role="tooltip">
      <div className="portal-pipeline-step__tooltip-card">
        <p className="portal-pipeline-step__tooltip-title">{label}</p>
        <p className="portal-pipeline-step__tooltip-desc">{description}</p>
        <span
          className={clsx(
            "portal-pipeline-step__tooltip-badge",
            state === "done" && "portal-pipeline-step__tooltip-badge--done",
            state === "active" && "portal-pipeline-step__tooltip-badge--active",
            state === "upcoming" &&
              "portal-pipeline-step__tooltip-badge--upcoming",
          )}
        >
          {badgeLabel}
        </span>
      </div>
      <div className="portal-pipeline-step__tooltip-arrow" aria-hidden />
    </div>
  );
}

export function PortalPipelineTracker({
  status,
  compact,
}: PortalPipelineTrackerProps) {
  const rejected = status === "REJECTED";
  const currentIdx = pipelineStepIndex(status);

  if (rejected) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium">
        Your application was not progressed further at this time. Thank you for
        your interest.
      </div>
    );
  }

  return (
    <div className={clsx("space-y-3", compact && "space-y-2")}>
      <div className="flex items-center gap-1 sm:gap-2">
        {PORTAL_PIPELINE_STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const connectorDone = i > 0 && i <= currentIdx;
          const stepState = done ? "done" : active ? "active" : "upcoming";

          return (
            <div key={step.status} className="contents">
              {i > 0 && (
                <ChevronRight
                  size={compact ? 16 : 18}
                  strokeWidth={2.5}
                  aria-hidden
                  className={clsx(
                    "shrink-0",
                    connectorDone ? "text-primary" : "text-muted-foreground",
                  )}
                />
              )}
              <div className="portal-pipeline-step group flex-1 flex flex-col items-center gap-1 min-w-0">
                <PipelineStepTooltip
                  label={step.label}
                  description={step.description}
                  state={stepState}
                />
                <div
                  tabIndex={0}
                  aria-label={`${step.label}. ${step.description}. ${
                    active
                      ? "Current stage."
                      : done
                        ? "Completed."
                        : "Upcoming."
                  }`}
                  className={clsx(
                    "portal-pipeline-step__dot size-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-colors",
                    done && "bg-primary border-primary text-primary-foreground",
                    active &&
                      "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                    !done &&
                      !active &&
                      "bg-surface-container-lowest border-outline-variant text-muted-foreground",
                  )}
                >
                  {done ? (
                    <span className="material-symbols-outlined text-base">
                      check
                    </span>
                  ) : (
                    i + 1
                  )}
                </div>
                {!compact && (
                  <span
                    className={clsx(
                      "text-[10px] font-bold text-center leading-tight",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!compact && !isTerminalStatus(status) && (
        <p className="text-xs text-slate-500 text-center">
          {PORTAL_PIPELINE_STEPS[currentIdx]?.description}
        </p>
      )}
    </div>
  );
}
