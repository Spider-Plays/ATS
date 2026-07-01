import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { ListSearchBar } from "@/components/ui/ListSearchBar";
import { AppSelect } from "@/components/ui/AppSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { OpenPositionCard } from "@/components/careers/OpenPositionCard";
import type { PortalOpenPosition } from "@/services/http/portal";
import "./jobs.css";

const ReferralJobs = () => {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");

  const { data: departments = [] } = useQuery({
    queryKey: ["referral-portal-departments"],
    queryFn: api.referralPortal.getDepartments,
  });

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ["referral-portal-positions", search, department],
    queryFn: () =>
      api.referralPortal.getPositions({
        q: search.trim() || undefined,
        department: department || undefined,
      }),
  });

  const sorted = useMemo(
    () =>
      [...positions].sort((a, b) => {
        const bonusDiff =
          (b.referralBonusAmount ?? 0) - (a.referralBonusAmount ?? 0);
        if (bonusDiff !== 0) return bonusDiff;
        return b.openingsRemaining - a.openingsRemaining;
      }),
    [positions],
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <span className="portal-page-eyebrow">Recruitment</span>
        <h1 className="text-page-title">Open roles</h1>
        <p className="text-page-desc">
          LIVE positions accepting employee referrals. Open a role to view
          details and refer someone. Bonus amounts are shown when configured by
          HR.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <ListSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by title, skills, client, or job code…"
          />
        </div>
        {departments.length > 0 && (
          <AppSelect
            className="min-w-[160px]"
            value={department}
            onChange={setDepartment}
            options={[
              { value: "", label: "All departments" },
              ...departments.map((d) => ({ value: d, label: d })),
            ]}
            aria-label="Filter by department"
          />
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-slate-500 py-12">Loading open roles…</p>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="work"
          title={search || department ? "No matching roles" : "No open roles"}
          description={
            search || department
              ? "Try a different search or department filter."
              : "There are no referral-eligible jobs right now. Check back soon or contact HR."
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {sorted.map((job) => (
            <li key={job.id}>
              <OpenPositionCard
                job={job as PortalOpenPosition}
                to={`/referral-portal/jobs/${job.id}`}
                actionLabel="View role →"
                referralBonusAmount={job.referralBonusAmount}
                openingsRemaining={job.openingsRemaining}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReferralJobs;
