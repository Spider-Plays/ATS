import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { ListSearchBar } from "@/components/ui/ListSearchBar";
import { matchesAnySearch } from "@/lib/textSearch";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReferralSubmissionCard } from "@/components/referral-portal/ReferralSubmissionCard";
import {
  matchesReferralStatusSearch,
  referralStatusLabel,
} from "@/lib/referralStatus";
import "./list.css";

const ReferralList = () => {
  const [search, setSearch] = useState("");
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["referral-portal-referrals"],
    queryFn: api.referralPortal.getReferrals,
  });

  const filtered = useMemo(
    () =>
      referrals.filter(
        (c) =>
          matchesAnySearch(
            [
              c.name,
              c.email,
              c.jobTitle,
              c.role,
              c.referralRelationship,
              referralStatusLabel(c.status),
            ],
            search,
          ) || matchesReferralStatusSearch(c.status, search),
      ),
    [referrals, search],
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <span className="portal-page-eyebrow">Referrals</span>
          <h1 className="text-page-title">My referrals</h1>
          <p className="text-page-desc">
            Everyone you have referred — track status and hiring progress.
          </p>
        </div>
        <Link
          to="/referral-portal/jobs"
          className="btn-filled inline-flex items-center justify-center px-5 py-2.5 text-sm shrink-0"
        >
          Refer someone new
        </Link>
      </header>

      <ListSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name, email, job, or status…"
      />

      {isLoading ? (
        <p className="text-center py-12 text-slate-500">Loading referrals…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="group"
          title={search ? "No matches" : "No referrals yet"}
          description={
            search
              ? "Try a different search."
              : "Browse open roles and submit your first referral."
          }
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((c) => (
            <li key={c.id}>
              <ReferralSubmissionCard
                referral={{
                  id: c.id,
                  name: c.name,
                  email: c.email,
                  status: c.status,
                  jobTitle: c.jobTitle ?? c.role,
                  jobCode: c.reqId,
                  requirementId: c.requirementId,
                  matchScore: c.matchScore,
                  phone: c.phone,
                  location: c.location,
                  referralRelationship: c.referralRelationship,
                  createdAt: c.createdAt,
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {!isLoading && filtered.length > 0 && (
        <p className="text-sm text-slate-500 text-center">
          Want to refer more talent?{" "}
          <Link
            to="/referral-portal/jobs"
            className="font-bold text-primary hover:underline"
          >
            Browse open roles
          </Link>
        </p>
      )}
    </div>
  );
};

export default ReferralList;
