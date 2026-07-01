import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { ListSearchBar } from "@/components/ui/ListSearchBar";
import { matchesAnySearch } from "@/lib/textSearch";
import { EmptyState } from "@/components/ui/EmptyState";
import { VendorSubmissionCard } from "@/components/vendor/VendorSubmissionCard";
import "./submissions.css";

const VendorSubmissions = () => {
  const [search, setSearch] = useState("");
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["vendor-portal-submissions"],
    queryFn: api.vendorPortal.getSubmissions,
  });

  const filtered = useMemo(
    () =>
      submissions.filter((c) =>
        matchesAnySearch(
          [c.name, c.email, c.status, c.jobTitle, c.role, c.reqId],
          search,
        ),
      ),
    [submissions, search],
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <span className="portal-page-eyebrow">Profiles</span>
        <h1 className="text-page-title">Submitted profiles</h1>
        <p className="text-page-desc">
          All candidate profiles you have submitted to assigned jobs.
        </p>
      </header>

      <ListSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name, email, job, or status..."
      />

      {isLoading ? (
        <p className="text-center py-12 text-slate-500">Loading profiles…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="group"
          title={search ? "No matches" : "No submissions yet"}
          description={
            search
              ? "Try a different search."
              : "Submit candidates from your assigned jobs."
          }
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((c) => (
            <li key={c.id}>
              <VendorSubmissionCard
                submission={{
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
                  createdAt: c.createdAt,
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {!isLoading && filtered.length > 0 && (
        <p className="text-sm text-slate-500 text-center">
          Need a status breakdown?{" "}
          <Link to="/vendor-portal/report" className="font-bold text-primary hover:underline">
            View submission report
          </Link>
        </p>
      )}
    </div>
  );
};

export default VendorSubmissions;
