import React, { useEffect, useState } from "react";
import {
  ExternalLink,
  Globe,
  Linkedin,
} from "lucide-react";
import { api } from "@/services/api";
import type { Candidate } from "@/types";
import { splitCandidateName } from "@/lib/vendorSubmissionForm";
import { CandidateProfileResume } from "@/pages/candidates/profile/components/CandidateProfileResume";
import {
  VendorProfileDetailCard,
  VendorProfileSection,
} from "./VendorProfileSection";

type VendorSubmissionProfileViewProps = {
  candidate: Candidate;
};

function SkillChips({ label, skills }: { label: string; skills: string[] }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>
      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li
              key={skill}
              className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-container text-on-primary-container border border-primary/10"
            >
              {skill}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LinkCard({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value?: string | null;
  href?: string;
  icon: React.ReactNode;
}) {
  const trimmed = value?.trim();
  return (
    <div className="p-4 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {trimmed && href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary mt-1 hover:underline break-all"
        >
          {icon}
          {trimmed}
          <ExternalLink size={13} className="shrink-0" />
        </a>
      ) : (
        <p className="text-sm font-bold text-primary dark:text-white mt-1">—</p>
      )}
    </div>
  );
}

export function VendorSubmissionProfileView({
  candidate,
}: VendorSubmissionProfileViewProps) {
  const { firstName, lastName } = splitCandidateName(candidate.name);
  const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  const hasResume = !!(candidate.hasResume || candidate.resumeFileName);
  const isPdfResume = !!(
    candidate.resumeMimeType === "application/pdf" ||
    candidate.resumeFileName?.toLowerCase().endsWith(".pdf")
  );

  useEffect(() => {
    if (!candidate.id || !hasResume) {
      setResumeBlobUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      setResumeLoading(true);
      try {
        const blob = await api.vendorPortal.fetchSubmissionResume(candidate.id);
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setResumeBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setResumeBlobUrl(null);
      } finally {
        if (!cancelled) setResumeLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [candidate.id, hasResume, candidate.resumeFileName]);

  return (
    <div className="space-y-6 min-w-0 flex-1">
      <VendorProfileSection title="Contact">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <VendorProfileDetailCard label="First name" value={firstName} />
          <VendorProfileDetailCard label="Last name" value={lastName} />
          <VendorProfileDetailCard label="Email" value={candidate.email} />
          <VendorProfileDetailCard label="Phone" value={candidate.phone} />
          <VendorProfileDetailCard label="PAN" value={candidate.pan} />
          <VendorProfileDetailCard label="Location" value={candidate.location} />
          <LinkCard
            label="LinkedIn"
            value={candidate.linkedIn}
            href={candidate.linkedIn}
            icon={<Linkedin size={14} />}
          />
          <LinkCard
            label="Portfolio"
            value={candidate.portfolio}
            href={candidate.portfolio}
            icon={<Globe size={14} />}
          />
        </div>
      </VendorProfileSection>

      <VendorProfileSection title="Compensation & availability">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <VendorProfileDetailCard
            label="Total experience"
            value={candidate.totalExperience}
          />
          <VendorProfileDetailCard
            label="Current company"
            value={candidate.currentCompany}
          />
          <VendorProfileDetailCard label="Current CTC" value={candidate.currentCTC} />
          <VendorProfileDetailCard label="Expected CTC" value={candidate.expectedCTC} />
          <VendorProfileDetailCard label="Notice period" value={candidate.noticePeriod} />
        </div>
      </VendorProfileSection>

      <VendorProfileSection title="Skills">
        <div className="space-y-4">
          <SkillChips label="Primary skills" skills={candidate.primarySkills ?? []} />
          <SkillChips label="Secondary skills" skills={candidate.secondarySkills ?? []} />
        </div>
      </VendorProfileSection>

      <VendorProfileSection title="Resume">
        <CandidateProfileResume
          candidate={candidate}
          hasResume={hasResume}
          isPdfResume={isPdfResume}
          resumeBlobUrl={resumeBlobUrl}
          resumeLoading={resumeLoading}
          canEdit={false}
          isUploadingResume={false}
          onUpload={() => {}}
        />
      </VendorProfileSection>
    </div>
  );
}
