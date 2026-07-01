import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { ListSearchBar } from "@/components/ui/ListSearchBar";
import { matchesAnySearch } from "@/lib/textSearch";
import { EmptyState } from "@/components/ui/EmptyState";
import { OpenPositionCard } from "@/components/careers/OpenPositionCard";
import type { PortalOpenPosition } from "@/services/http/portal";
import "./positions.css";

const VendorPositions = () => {
  const [search, setSearch] = useState("");
  const { data: positions = [], isLoading } = useQuery({
    queryKey: ["vendor-portal-positions"],
    queryFn: api.vendorPortal.getPositions,
  });

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return positions;
    return positions.filter((j) =>
      matchesAnySearch(
        [j.title, j.department, j.client, j.location, j.jobCode],
        q,
      ),
    );
  }, [positions, search]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <span className="portal-page-eyebrow">Recruitment</span>
        <h1 className="text-page-title">Assigned jobs</h1>
        <p className="text-page-desc">
          LIVE positions your organization can submit candidates for. Open a
          job to view details and add profiles.
        </p>
      </header>

      <ListSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by title, department, client, location…"
      />

      {isLoading ? (
        <p className="text-center text-slate-500 py-12">Loading positions…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="work"
          title={search ? "No matching jobs" : "No jobs assigned"}
          description={
            search
              ? "Try a different search term."
              : "Your HR team has not assigned any open roles to your vendor account yet."
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {filtered.map((job) => (
            <li key={job.id}>
              <OpenPositionCard
                job={job as PortalOpenPosition}
                to={`/vendor-portal/positions/${job.id}`}
                actionLabel="View job →"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VendorPositions;
