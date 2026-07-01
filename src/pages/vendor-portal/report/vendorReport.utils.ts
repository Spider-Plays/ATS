import { format, getQuarter, getYear } from "date-fns";
import type { Candidate, CandidateStatus } from "@/types";
import {
  CANDIDATE_STAGE_ORDER,
  candidateStatusLabel,
  isTerminalStatus,
} from "@/pages/candidates/_shared/candidate.utils";
import { matchesAnySearch } from "@/lib/textSearch";

export type VendorReportMetrics = {
  candidateCount: number;
  jobCount: number;
  activeCount: number;
  avgMatchScore: number;
};

export type VendorCandidateRow = {
  id: string;
  name: string;
  email: string;
  status: CandidateStatus;
  jobTitle?: string | null;
  jobCode?: string | null;
  requirementId?: string | null;
  matchScore: number;
  createdAt: string;
};

export type VendorJobBucket = {
  key: string;
  jobTitle: string;
  jobCode?: string;
  requirementId?: string;
  metrics: VendorReportMetrics;
  candidates: VendorCandidateRow[];
};

export type VendorMonthBucket = {
  key: string;
  label: string;
  metrics: VendorReportMetrics;
  jobs: VendorJobBucket[];
};

export type VendorQuarterBucket = {
  key: string;
  label: string;
  metrics: VendorReportMetrics;
  months: VendorMonthBucket[];
};

export type VendorStatusBucket = {
  status: CandidateStatus;
  label: string;
  metrics: VendorReportMetrics;
  quarters: VendorQuarterBucket[];
};

function toRow(candidate: Candidate): VendorCandidateRow {
  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    status: candidate.status,
    jobTitle: candidate.jobTitle ?? candidate.role,
    jobCode: candidate.reqId,
    requirementId: candidate.requirementId,
    matchScore: candidate.matchScore ?? 0,
    createdAt: candidate.createdAt ?? candidate.appliedDate,
  };
}

export function computeVendorReportMetrics(
  candidates: VendorCandidateRow[],
): VendorReportMetrics {
  const jobIds = new Set(
    candidates.map((c) => c.requirementId).filter(Boolean) as string[],
  );
  const activeCount = candidates.filter(
    (c) => !isTerminalStatus(c.status),
  ).length;
  const matchTotal = candidates.reduce((sum, c) => sum + c.matchScore, 0);

  return {
    candidateCount: candidates.length,
    jobCount: jobIds.size,
    activeCount,
    avgMatchScore:
      candidates.length > 0 ? Math.round(matchTotal / candidates.length) : 0,
  };
}

function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

function quarterKey(date: Date): string {
  return `${getYear(date)}-Q${getQuarter(date)}`;
}

function quarterLabel(key: string): string {
  const [yearPart, quarterPart] = key.split("-Q");
  return `Q${quarterPart} ${yearPart}`;
}

function sortByKeyDesc<T extends { key: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.key.localeCompare(a.key));
}

function buildJobBuckets(candidates: VendorCandidateRow[]): VendorJobBucket[] {
  const byJob = new Map<string, VendorCandidateRow[]>();

  for (const candidate of candidates) {
    const key = candidate.requirementId ?? candidate.jobTitle ?? "unknown";
    const list = byJob.get(key) ?? [];
    list.push(candidate);
    byJob.set(key, list);
  }

  return [...byJob.entries()]
    .map(([key, rows]) => {
      const first = rows[0];
      return {
        key,
        jobTitle: first.jobTitle ?? "Unassigned job",
        jobCode: first.jobCode ?? undefined,
        requirementId: first.requirementId ?? undefined,
        metrics: computeVendorReportMetrics(rows),
        candidates: [...rows].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      };
    })
    .sort((a, b) => a.jobTitle.localeCompare(b.jobTitle));
}

function buildMonthBuckets(candidates: VendorCandidateRow[]): VendorMonthBucket[] {
  const byMonth = new Map<string, VendorCandidateRow[]>();
  for (const candidate of candidates) {
    const key = monthKey(new Date(candidate.createdAt));
    const list = byMonth.get(key) ?? [];
    list.push(candidate);
    byMonth.set(key, list);
  }

  return sortByKeyDesc(
    [...byMonth.entries()].map(([key, rows]) => ({
      key,
      label: monthLabel(key),
      metrics: computeVendorReportMetrics(rows),
      jobs: buildJobBuckets(rows),
    })),
  );
}

function buildQuarterBuckets(
  candidates: VendorCandidateRow[],
): VendorQuarterBucket[] {
  const byQuarter = new Map<string, VendorCandidateRow[]>();
  for (const candidate of candidates) {
    const key = quarterKey(new Date(candidate.createdAt));
    const list = byQuarter.get(key) ?? [];
    list.push(candidate);
    byQuarter.set(key, list);
  }

  return sortByKeyDesc(
    [...byQuarter.entries()].map(([key, rows]) => ({
      key,
      label: quarterLabel(key),
      metrics: computeVendorReportMetrics(rows),
      months: buildMonthBuckets(rows),
    })),
  );
}

export function buildVendorStatusReport(
  candidates: Candidate[],
): VendorStatusBucket[] {
  const rows = candidates.map(toRow);
  const byStatus = new Map<CandidateStatus, VendorCandidateRow[]>();

  for (const status of CANDIDATE_STAGE_ORDER) {
    byStatus.set(status, []);
  }

  for (const row of rows) {
    const list = byStatus.get(row.status) ?? [];
    list.push(row);
    byStatus.set(row.status, list);
  }

  return CANDIDATE_STAGE_ORDER.map((status) => {
    const statusRows = byStatus.get(status) ?? [];
    return {
      status,
      label: candidateStatusLabel(status),
      metrics: computeVendorReportMetrics(statusRows),
      quarters: buildQuarterBuckets(statusRows),
    };
  }).filter((bucket) => bucket.metrics.candidateCount > 0);
}

export function vendorReportSearchFields(
  candidate: VendorCandidateRow,
): (string | undefined | null)[] {
  return [
    candidate.name,
    candidate.email,
    candidate.jobTitle,
    candidate.jobCode,
    candidate.status,
    candidateStatusLabel(candidate.status),
  ];
}

export function filterCandidatesForVendorReport(
  candidates: Candidate[],
  query: string,
): Candidate[] {
  const q = query.trim();
  if (!q) return candidates;
  return candidates.filter((c) =>
    matchesAnySearch(vendorReportSearchFields(toRow(c)), q),
  );
}

export function computeVendorReportTotals(
  buckets: VendorStatusBucket[],
  candidates?: Candidate[],
) {
  const fromBuckets = buckets.reduce(
    (acc, row) => ({
      candidateCount: acc.candidateCount + row.metrics.candidateCount,
      activeCount: acc.activeCount + row.metrics.activeCount,
    }),
    { candidateCount: 0, activeCount: 0 },
  );

  const jobCount = candidates
    ? new Set(candidates.map((c) => c.requirementId).filter(Boolean)).size
    : buckets.reduce((sum, row) => sum + row.metrics.jobCount, 0);

  return { ...fromBuckets, jobCount };
}
