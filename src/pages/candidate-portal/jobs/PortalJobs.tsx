import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { ListSearchBar } from "@/components/ui/ListSearchBar";
import { matchesAnySearch } from "@/lib/textSearch";
import { PortalApplicationCard } from "@/components/portal/PortalApplicationCard";
import { OpenPositionCard } from "@/components/careers/OpenPositionCard";
import {
  PortalPagePanel,
  PortalTwoColumnPage,
} from "@/components/portal/PortalTwoColumnPage";
import clsx from "clsx";

type JobsTab = "open" | "applied";

const PortalJobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: JobsTab =
    searchParams.get("tab") === "applied" ? "applied" : "open";
  const [search, setSearch] = useState("");

  const setTab = (next: JobsTab) => {
    setSearchParams(next === "applied" ? { tab: "applied" } : {}, {
      replace: true,
    });
  };

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["portal-positions"],
    queryFn: api.portal.getOpenPositions,
  });

  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ["portal-applications"],
    queryFn: api.portal.getApplications,
  });

  const { data: portalMe } = useQuery({
    queryKey: ["portal-me"],
    queryFn: api.portal.getMe,
  });

  const applications = applicationsData?.applications ?? [];

  const appliedId =
    portalMe?.linked && portalMe.candidate.requirementId
      ? portalMe.candidate.requirementId
      : null;

  const filteredJobs = useMemo(() => {
    const q = search.trim();
    if (!q) return jobs;
    return jobs.filter((j) =>
      matchesAnySearch(
        [j.title, j.department, j.client, j.location, j.jobCode],
        q,
      ),
    );
  }, [jobs, search]);

  const isLoading = tab === "open" ? jobsLoading : appsLoading;

  return (
    <PortalTwoColumnPage
      hero={{
        eyebrow: "Careers",
        title: "Jobs",
        subtitle:
          "Browse open roles and track applications you have submitted.",
      }}
      sidebar={
        <>
          <div className="portal-page-tabs" role="tablist" aria-label="Jobs views">
            {(
              [
                ["open", "Open roles", jobs.length] as const,
                ["applied", "Applied", applications.length] as const,
              ] as const
            ).map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={clsx(
                  "portal-page-tabs__btn",
                  tab === id && "portal-page-tabs__btn--active",
                )}
                onClick={() => setTab(id)}
              >
                {label}
                {count > 0 && (
                  <span className="ml-1 opacity-70">({count})</span>
                )}
              </button>
            ))}
          </div>

          <PortalPagePanel
            title={tab === "open" ? "Open roles" : "Your applications"}
            flush={tab === "open" && filteredJobs.length > 0}
          >
            {tab === "open" && (
              <div className="space-y-4">
                <div className="px-4 pt-4">
                  <ListSearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by title, department, client…"
                  />
                </div>
                {isLoading ? (
                  <p className="text-slate-500 text-center py-10 text-sm">
                    Loading positions…
                  </p>
                ) : filteredJobs.length === 0 ? (
                  <div className="portal-dash-empty">
                    <span className="material-symbols-outlined portal-dash-empty__icon">
                      work
                    </span>
                    <p className="portal-dash-empty__title">
                      {search ? "No matching roles" : "No open roles"}
                    </p>
                    <p className="portal-dash-empty__text">
                      {search
                        ? "Try a different search term."
                        : "New positions will appear here when published."}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {filteredJobs.map((job) => (
                      <li key={job.id} className="p-3">
                        <OpenPositionCard
                          job={job}
                          to={`/candidate/jobs/${job.id}`}
                          isApplied={appliedId === job.id}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === "applied" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Roles you have applied for. Closed or inactive positions show
                  as <strong>Closed</strong>.
                </p>
                {isLoading ? (
                  <p className="text-slate-500 text-center py-10 text-sm">
                    Loading applications…
                  </p>
                ) : applications.length === 0 ? (
                  <div className="portal-dash-empty">
                    <span className="material-symbols-outlined portal-dash-empty__icon">
                      assignment
                    </span>
                    <p className="portal-dash-empty__title">
                      No applications yet
                    </p>
                    <p className="portal-dash-empty__text">
                      Switch to Open roles to find a position and apply.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTab("open")}
                      className="portal-dash-promo__btn !mt-4"
                    >
                      Browse open roles
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {applications.map((app) => (
                      <li key={app.requirementId}>
                        <PortalApplicationCard app={app} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </PortalPagePanel>
        </>
      }
    />
  );
};

export default PortalJobs;
