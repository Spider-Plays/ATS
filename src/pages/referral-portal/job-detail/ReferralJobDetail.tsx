import React from "react";
import { Link, useParams } from "react-router-dom";
import { Gift, Loader2, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { OpenPositionJobDetailBody } from "@/components/careers/OpenPositionJobDetailBody";
import { BackButton } from "@/components/ui/BackButton";
import type { PortalOpenPosition } from "@/services/http/portal";
import { ApiError } from "@/lib/apiClient";
import "@/pages/careers/igs/igs.css";
import "./job-detail.css";

const ReferralJobDetail = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["referral-portal-position", id],
    queryFn: () => api.referralPortal.getPosition(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center text-slate-500">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <p className="text-red-600 font-medium">
          {error instanceof ApiError ? error.message : "Job not found"}
        </p>
        <BackButton
          fallback="/referral-portal/jobs"
          label="Back"
          variant="muted"
        />
      </div>
    );
  }

  const position = job as PortalOpenPosition;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <BackButton
        fallback="/referral-portal/jobs"
        label="All roles"
        variant="muted"
      />

      <article className="p-6 md:p-8 shadow-sm space-y-6 igs-job-detail-card">
        <OpenPositionJobDetailBody
          job={position}
          variant="igs"
          showClient
        >
          {job.referralBonusAmount ? (
            <div className="portal-bonus-pill w-fit">
              <Gift size={14} className="text-tertiary" />
              <span className="portal-bonus-text">
                ₹{job.referralBonusAmount.toLocaleString("en-IN")} referral
                bonus
              </span>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/referral-portal/jobs/${id}/submit`}
              className="igs-btn-capabilities !text-sm inline-flex items-center justify-center gap-2"
            >
              <UserPlus size={16} />
              Refer a candidate
            </Link>
          </div>
          <p className="text-sm text-slate-600">
            Upload their resume, tell us how you know them, and we&apos;ll route
            them to recruiting.
          </p>
        </OpenPositionJobDetailBody>
      </article>
    </div>
  );
};

export default ReferralJobDetail;
