import React from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { OpenPositionJobDetailBody } from "@/components/careers/OpenPositionJobDetailBody";
import { BackButton } from "@/components/ui/BackButton";
import type { PortalOpenPosition } from "@/services/http/portal";
import { ApiError } from "@/lib/apiClient";
import "@/pages/careers/igs/igs.css";
import "./job-detail.css";

const VendorJobDetail = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["vendor-portal-position", id],
    queryFn: () => api.vendorPortal.getPosition(id!),
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
          fallback="/vendor-portal/positions"
          label="Back"
          variant="muted"
        />
      </div>
    );
  }

  const position = job as PortalOpenPosition;

  return (
    <div className="mx-auto p-4 md:p-8 space-y-6 careers-job-detail max-w-[80rem]">
      <BackButton
        fallback="/vendor-portal/positions"
        label="Back"
        variant="muted"
      />

      <article className="p-6 md:p-8 shadow-sm space-y-6 igs-job-detail-card">
        <OpenPositionJobDetailBody
          job={position}
          variant="igs"
          showClient
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/vendor-portal/positions/${id}/submit`}
              className="igs-btn-capabilities !text-sm inline-flex items-center justify-center gap-2"
            >
              <UserPlus size={16} />
              Submit candidate
            </Link>
          </div>
          <p className="text-sm text-slate-600">
            Upload a resume and complete the candidate profile to submit for
            this role.
          </p>
        </OpenPositionJobDetailBody>
      </article>
    </div>
  );
};

export default VendorJobDetail;
