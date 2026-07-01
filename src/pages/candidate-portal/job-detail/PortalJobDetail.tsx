import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Building2, Hash, Loader2, MapPin } from "lucide-react";
import { api } from "@/services/api";
import { ApiError } from "@/lib/apiClient";
import { useToastStore } from "@/store/toastStore";
import { OpenPositionJobDetailBody } from "@/components/careers/OpenPositionJobDetailBody";
import { PortalJobApplicationStatus } from "@/components/portal/PortalJobApplicationStatus";
import { BackButton } from "@/components/ui/BackButton";
import {
  PortalPageLoading,
  PortalTwoColumnPage,
} from "@/components/portal/PortalTwoColumnPage";
import clsx from "clsx";

const PortalJobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [applied, setApplied] = useState(false);

  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["portal-position", id],
    queryFn: () => api.portal.getPosition(id!),
    enabled: !!id,
  });

  const { data: portalMe } = useQuery({
    queryKey: ["portal-me"],
    queryFn: api.portal.getMe,
  });

  const { data: applicationsData } = useQuery({
    queryKey: ["portal-applications"],
    queryFn: api.portal.getApplications,
  });

  const applicationForJob = useMemo(
    () =>
      applicationsData?.applications.find((app) => app.requirementId === id),
    [applicationsData, id],
  );

  const profileComplete = portalMe?.profileComplete === true;

  const alreadyOnThisJob =
    portalMe?.linked === true && portalMe.candidate.requirementId === id;

  const appliedToOtherJob =
    portalMe?.linked === true &&
    !!portalMe.candidate.requirementId &&
    portalMe.candidate.requirementId !== id;

  const canApply =
    profileComplete &&
    portalMe?.linked === true &&
    !alreadyOnThisJob &&
    !appliedToOtherJob &&
    !applied;

  const applyMutation = useMutation({
    mutationFn: () => api.portal.applyToPosition(id!),
    onSuccess: (result) => {
      setApplied(true);
      queryClient.invalidateQueries({ queryKey: ["portal-me"] });
      queryClient.invalidateQueries({ queryKey: ["portal-positions"] });
      if (result.alreadyApplied) {
        addToast("You have already applied for this position", "info");
      } else {
        addToast("Application submitted successfully", "success");
      }
      queryClient.invalidateQueries({ queryKey: ["portal-applications"] });
      navigate(`/candidate/jobs/applied/${id}`, {
        state: { from: `/candidate/jobs/${id}` },
      });
    },
    onError: (err: unknown) => {
      if (
        err instanceof ApiError &&
        err.message.includes("Complete your candidate profile")
      ) {
        addToast(err.message, "error");
        navigate(
          `/candidate/onboarding?returnTo=${encodeURIComponent(`/candidate/jobs/${id}`)}`,
        );
        return;
      }
      addToast(
        err instanceof ApiError ? err.message : "Failed to apply",
        "error",
      );
    },
  });

  if (isLoading) {
    return <PortalPageLoading label="Loading job details…" />;
  }

  if (isError || !job) {
    return (
      <div className="portal-page portal-page--narrow max-w-md mx-auto text-center space-y-4">
        <p className="text-red-600 font-medium">
          {error instanceof ApiError ? error.message : "Job not found"}
        </p>
        <BackButton
          fallback="/candidate/jobs"
          to="/candidate/jobs"
          label="Back to jobs"
          variant="muted"
        />
      </div>
    );
  }

  return (
    <PortalTwoColumnPage
      back={{ fallback: "/candidate/jobs" }}
      hero={{
        eyebrow: "Open role",
        title: job.title,
        subtitle: job.client
          ? `${job.client} · ${job.department}`
          : job.department,
        meta: (
          <>
            <span>
              <Hash size={14} aria-hidden />
              {job.jobCode}
            </span>
            {job.client && (
              <span>
                <Building2 size={14} aria-hidden />
                {job.client}
              </span>
            )}
            <span>
              <Briefcase size={14} aria-hidden />
              {job.department}
            </span>
            {job.location && (
              <span>
                <MapPin size={14} aria-hidden />
                {job.location}
              </span>
            )}
          </>
        ),
      }}
      sidebar={
        <article className="portal-job-detail">
          <div className="portal-job-detail__body">
            <OpenPositionJobDetailBody job={job} variant="default" showClient>
              {applicationForJob && (
                <PortalJobApplicationStatus
                  application={applicationForJob}
                  variant="default"
                />
              )}
            </OpenPositionJobDetailBody>
          </div>

          <div className="portal-job-detail__actions">
            {!applicationForJob && (
              <button
                type="button"
                onClick={() => applyMutation.mutate()}
                disabled={!canApply || applyMutation.isPending}
                className={clsx("portal-job-detail__apply")}
              >
                {applyMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting…
                  </>
                ) : appliedToOtherJob ? (
                  "Applied to another role"
                ) : !profileComplete ? (
                  "Complete profile to apply"
                ) : (
                  "Apply for this position"
                )}
              </button>
            )}

            {applicationForJob && alreadyOnThisJob && (
              <p className="text-sm text-primary font-medium">
                Your profile is linked to this requisition ({job.jobCode}).
              </p>
            )}

            {!applicationForJob && !profileComplete && (
              <p className="text-sm text-amber-700 font-medium">
                <Link
                  to={`/candidate/onboarding?returnTo=${encodeURIComponent(`/candidate/jobs/${id}`)}`}
                  className="font-bold underline"
                >
                  Complete your profile
                </Link>{" "}
                before applying.
              </p>
            )}

            {!applicationForJob && appliedToOtherJob && (
              <p className="text-sm text-amber-700 font-medium">
                You already have an active application for another role.{" "}
                <Link to="/candidate/dashboard" className="font-bold underline">
                  View your dashboard
                </Link>{" "}
                for status.
              </p>
            )}
          </div>
        </article>
      }
    />
  );
};

export default PortalJobDetail;
