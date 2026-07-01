import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { api } from "@/services/api";
import { ListSearchBar } from "@/components/ui/ListSearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { InterviewStatCard } from "@/components/interviews/InterviewStatCard";
import {
  candidateStatusClass,
} from "@/pages/candidates/_shared/candidate.utils";
import {
  buildVendorStatusReport,
  computeVendorReportTotals,
  filterCandidatesForVendorReport,
  type VendorJobBucket,
  type VendorMonthBucket,
  type VendorQuarterBucket,
  type VendorReportMetrics,
  type VendorStatusBucket,
  type VendorCandidateRow,
} from "./vendorReport.utils";
import "@/pages/reports/hiring-report/report.css";
import "./report.css";

const EMPTY = <span className="hiring-report__empty">—</span>;

function StatusMetrics({ metrics }: { metrics: VendorReportMetrics }) {
  return (
    <>
      <td className="hiring-report__cell hiring-report__cell--num">
        {metrics.candidateCount}
      </td>
      <td className="hiring-report__cell hiring-report__cell--num">
        {metrics.jobCount}
      </td>
      <td className="hiring-report__cell hiring-report__cell--num">
        {metrics.activeCount}
      </td>
      <td className="hiring-report__cell hiring-report__cell--num">
        {metrics.avgMatchScore > 0 ? `${metrics.avgMatchScore}%` : EMPTY}
      </td>
    </>
  );
}

function ExpandButton({
  expanded,
  onClick,
  label,
}: {
  expanded: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="hiring-report__expand"
      aria-expanded={expanded}
      aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
    >
      {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}

function CandidateRows({ candidates }: { candidates: VendorCandidateRow[] }) {
  return (
    <>
      {candidates.map((candidate) => (
        <tr key={candidate.id} className="hiring-report__row hiring-report__row--requirement">
          <td className="hiring-report__cell hiring-report__cell--label">
            <div className="hiring-report__req-title pl-8">{candidate.name}</div>
            <div className="hiring-report__req-meta pl-8">
              {candidate.email}
              {candidate.jobCode ? ` · ${candidate.jobCode}` : ""}
            </div>
          </td>
          <td className="hiring-report__cell hiring-report__cell--num">1</td>
          <td className="hiring-report__cell hiring-report__cell--num">{EMPTY}</td>
          <td className="hiring-report__cell hiring-report__cell--num">{EMPTY}</td>
          <td className="hiring-report__cell hiring-report__cell--num">
            {candidate.matchScore > 0 ? `${candidate.matchScore}%` : EMPTY}
          </td>
        </tr>
      ))}
    </>
  );
}

function JobSection({
  job,
  expandAll,
}: {
  job: VendorJobBucket;
  expandAll?: boolean;
}) {
  const [expanded, setExpanded] = useState(expandAll ?? false);
  const isExpanded = expandAll || expanded;

  return (
    <>
      <tr className="hiring-report__row hiring-report__row--month">
        <td className="hiring-report__cell hiring-report__cell--label">
          <div className="hiring-report__label-wrap hiring-report__label-wrap--month">
            <ExpandButton
              expanded={isExpanded}
              onClick={() => setExpanded((v) => !v)}
              label={job.jobTitle}
            />
            <span>{job.jobTitle}</span>
          </div>
        </td>
        <td className="hiring-report__cell hiring-report__cell--num">
          {job.metrics.candidateCount}
        </td>
        <td className="hiring-report__cell hiring-report__cell--num">{EMPTY}</td>
        <td className="hiring-report__cell hiring-report__cell--num">{EMPTY}</td>
        <td className="hiring-report__cell hiring-report__cell--num">
          {job.metrics.avgMatchScore > 0 ? `${job.metrics.avgMatchScore}%` : EMPTY}
        </td>
      </tr>
      {isExpanded && <CandidateRows candidates={job.candidates} />}
    </>
  );
}

function MonthSection({
  month,
  expanded,
  onToggle,
  expandAll,
}: {
  month: VendorMonthBucket;
  expanded: boolean;
  onToggle: () => void;
  expandAll?: boolean;
}) {
  const isExpanded = expandAll || expanded;

  return (
    <>
      <tr className="hiring-report__row hiring-report__row--month">
        <td className="hiring-report__cell hiring-report__cell--label">
          <div className="hiring-report__label-wrap hiring-report__label-wrap--month">
            <ExpandButton expanded={isExpanded} onClick={onToggle} label={month.label} />
            <span>{month.label}</span>
          </div>
        </td>
        <StatusMetrics metrics={month.metrics} />
      </tr>
      {isExpanded &&
        month.jobs.map((job) => (
          <JobSection key={job.key} job={job} expandAll={expandAll} />
        ))}
    </>
  );
}

function QuarterSection({
  quarter,
  expandedMonths,
  onToggleMonth,
  expandAll,
}: {
  quarter: VendorQuarterBucket;
  expandedMonths: Set<string>;
  onToggleMonth: (monthKey: string) => void;
  expandAll?: boolean;
}) {
  const [expanded, setExpanded] = useState(expandAll ?? false);
  const isExpanded = expandAll || expanded;

  return (
    <>
      <tr className="hiring-report__row hiring-report__row--quarter">
        <td className="hiring-report__cell hiring-report__cell--label">
          <div className="hiring-report__label-wrap hiring-report__label-wrap--quarter">
            <ExpandButton
              expanded={isExpanded}
              onClick={() => setExpanded((v) => !v)}
              label={quarter.label}
            />
            <span>{quarter.label}</span>
          </div>
        </td>
        <StatusMetrics metrics={quarter.metrics} />
      </tr>
      {isExpanded &&
        quarter.months.map((month) => (
          <MonthSection
            key={month.key}
            month={month}
            expanded={expandedMonths.has(`${quarter.key}:${month.key}`)}
            onToggle={() => onToggleMonth(`${quarter.key}:${month.key}`)}
            expandAll={expandAll}
          />
        ))}
    </>
  );
}

function StatusSection({
  bucket,
  expandAll,
}: {
  bucket: VendorStatusBucket;
  expandAll?: boolean;
}) {
  const [expanded, setExpanded] = useState(expandAll ?? false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    () => new Set(),
  );
  const isExpanded = expandAll || expanded;

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <>
      <tr className="hiring-report__row hiring-report__row--account">
        <td className="hiring-report__cell hiring-report__cell--label">
          <div className="hiring-report__label-wrap">
            <ExpandButton
              expanded={isExpanded}
              onClick={() => setExpanded((v) => !v)}
              label={bucket.label}
            />
            <span
              className={clsx(
                "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                candidateStatusClass(bucket.status),
              )}
            >
              {bucket.label}
            </span>
          </div>
        </td>
        <StatusMetrics metrics={bucket.metrics} />
      </tr>
      {isExpanded &&
        bucket.quarters.map((quarter) => (
          <QuarterSection
            key={quarter.key}
            quarter={quarter}
            expandedMonths={expandedMonths}
            onToggleMonth={toggleMonth}
            expandAll={expandAll}
          />
        ))}
    </>
  );
}

const VendorReport = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["vendor-portal-submissions"],
    queryFn: api.vendorPortal.getSubmissions,
  });

  const searchActive = searchTerm.trim().length > 0;

  const filtered = useMemo(
    () => filterCandidatesForVendorReport(submissions, searchTerm),
    [submissions, searchTerm],
  );

  const statusBuckets = useMemo(
    () => buildVendorStatusReport(filtered),
    [filtered],
  );

  const totals = useMemo(
    () => computeVendorReportTotals(statusBuckets, filtered),
    [statusBuckets, filtered],
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <header className="space-y-2">
        <span className="portal-page-eyebrow">Insights</span>
        <h1 className="text-page-title">Submission report</h1>
        <p className="text-page-desc">
          Expand a status to see quarters, months, and jobs. Review every
          candidate profile you have submitted.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <InterviewStatCard
          label="Profiles"
          value={totals.candidateCount}
          icon={Users}
          accent="brand"
        />
        <InterviewStatCard
          label="Jobs"
          value={totals.jobCount}
          icon={Briefcase}
          accent="slate"
        />
        <InterviewStatCard
          label="In pipeline"
          value={totals.activeCount}
          icon={BarChart3}
          accent="blue"
        />
        <InterviewStatCard
          label="Status groups"
          value={statusBuckets.length}
          icon={BarChart3}
          accent="amber"
        />
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 -mt-4">
        Grouped by candidate stage instead of account.{" "}
        <Link to="/vendor-portal/submissions" className="font-bold text-primary hover:underline">
          View all profiles
        </Link>
      </p>

      <ListSearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search by name, email, job, or status..."
      />

      {isLoading ? (
        <div className="hiring-report__loading">Loading report…</div>
      ) : submissions.length === 0 ? (
        <EmptyState
          icon="bar_chart"
          title="No submissions to report"
          description="Submit candidates from your assigned jobs to see status breakdowns here."
        />
      ) : statusBuckets.length === 0 ? (
        <EmptyState
          icon="search"
          title="No matches"
          description="Try a different name, email, job title, or status."
        />
      ) : (
        <div className="hiring-report__table-wrap app-card rounded-2xl border overflow-hidden">
          <table className="hiring-report__table">
            <thead>
              <tr>
                <th>Status / period / job / candidate</th>
                <th>Profiles</th>
                <th>Jobs</th>
                <th>In pipeline</th>
                <th>Avg match</th>
              </tr>
            </thead>
            <tbody>
              {statusBuckets.map((bucket) => (
                <StatusSection
                  key={bucket.status}
                  bucket={bucket}
                  expandAll={searchActive}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorReport;
