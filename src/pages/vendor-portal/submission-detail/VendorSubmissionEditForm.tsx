import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Upload } from "lucide-react";
import clsx from "clsx";
import { api } from "@/services/api";
import { ApiError } from "@/lib/apiClient";
import { useToastStore } from "@/store/toastStore";
import { IndianItCitySelect } from "@/components/candidates/IndianItCitySelect";
import { SkillSelectSection } from "@/components/skills/SkillSelectSection";
import {
  vendorSubmissionSchema,
  type VendorSubmissionFormValues,
} from "@/lib/candidateSubmissionForm";
import { candidateToVendorForm } from "@/lib/vendorSubmissionForm";
import type { Candidate } from "@/types";
import { PROFILE_INPUT, PROFILE_LABEL } from "@/pages/candidates/profile/profile.utils";
import { VendorProfileSection } from "./VendorProfileSection";

function FieldLabel({
  children,
  required = true,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className={PROFILE_LABEL}>
      {required && <span className="text-red-500 mr-0.5">*</span>}
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-bold text-red-500 mt-1">{message}</p>;
}

type VendorSubmissionEditFormProps = {
  candidateId: string;
  candidate: Candidate;
  onCancel: () => void;
  onSaved: () => void;
};

export function VendorSubmissionEditForm({
  candidateId,
  candidate,
  onCancel,
  onSaved,
}: VendorSubmissionEditFormProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<VendorSubmissionFormValues>({
    resolver: zodResolver(vendorSubmissionSchema),
    defaultValues: candidateToVendorForm(candidate),
  });

  useEffect(() => {
    reset(candidateToVendorForm(candidate));
  }, [candidate, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: VendorSubmissionFormValues) =>
      api.vendorPortal.updateSubmission(candidateId, {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        location: values.location.trim(),
        pan: values.pan.trim().toUpperCase(),
        totalExperience: values.totalExperience.trim(),
        currentCompany: values.currentCompany.trim(),
        currentCTC: values.currentCTC.trim(),
        expectedCTC: values.expectedCTC.trim(),
        noticePeriod: values.noticePeriod.trim(),
        linkedIn: values.linkedin?.trim() || undefined,
        portfolio: values.portfolio?.trim() || undefined,
        primarySkills: values.primarySkills,
        secondarySkills: values.secondarySkills ?? [],
      }),
    onSuccess: () => {
      addToast("Profile updated successfully", "success");
      queryClient.invalidateQueries({
        queryKey: ["vendor-portal-submission", candidateId],
      });
      queryClient.invalidateQueries({ queryKey: ["vendor-portal-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-portal-me"] });
      onSaved();
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : "Update failed", "error");
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (file: File) => api.vendorPortal.uploadResume(candidateId, file),
    onSuccess: () => {
      addToast("Resume uploaded", "success");
      setResumeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({
        queryKey: ["vendor-portal-submission", candidateId],
      });
      queryClient.invalidateQueries({ queryKey: ["vendor-portal-submissions"] });
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : "Upload failed", "error");
    },
  });

  return (
    <form
      className="space-y-6 min-w-0 flex-1"
      onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
    >
      <VendorProfileSection
        title="Contact"
        description="Update candidate contact details."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>First name</FieldLabel>
            <input className={PROFILE_INPUT} {...register("firstName")} />
            <FieldError message={errors.firstName?.message} />
          </div>
          <div>
            <FieldLabel>Last name</FieldLabel>
            <input className={PROFILE_INPUT} {...register("lastName")} />
            <FieldError message={errors.lastName?.message} />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
              <input type="email" className={clsx(PROFILE_INPUT, "pl-10")} {...register("email")} />
            </div>
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
              <input className={clsx(PROFILE_INPUT, "pl-10")} {...register("phone")} />
            </div>
            <FieldError message={errors.phone?.message} />
          </div>
          <div>
            <FieldLabel>PAN</FieldLabel>
            <input className={clsx(PROFILE_INPUT, "uppercase")} maxLength={10} {...register("pan")} />
            <FieldError message={errors.pan?.message} />
          </div>
          <div>
            <FieldLabel>Location</FieldLabel>
            <Controller
              control={control}
              name="location"
              render={({ field }) => (
                <IndianItCitySelect value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
            <FieldError message={errors.location?.message} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel required={false}>LinkedIn</FieldLabel>
            <input className={PROFILE_INPUT} {...register("linkedin")} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel required={false}>Portfolio</FieldLabel>
            <input className={PROFILE_INPUT} {...register("portfolio")} />
          </div>
        </div>
      </VendorProfileSection>

      <VendorProfileSection title="Compensation & availability">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              ["totalExperience", "Total experience"],
              ["currentCompany", "Current company"],
              ["currentCTC", "Current CTC"],
              ["expectedCTC", "Expected CTC"],
            ] as const
          ).map(([name, label]) => (
            <div key={name}>
              <FieldLabel>{label}</FieldLabel>
              <input className={PROFILE_INPUT} {...register(name)} />
              <FieldError message={errors[name]?.message} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <FieldLabel>Notice period</FieldLabel>
            <input className={PROFILE_INPUT} {...register("noticePeriod")} />
            <FieldError message={errors.noticePeriod?.message} />
          </div>
        </div>
      </VendorProfileSection>

      <VendorProfileSection title="Skills">
        <Controller
          control={control}
          name="primarySkills"
          render={({ field: primaryField }) => (
            <Controller
              control={control}
              name="secondarySkills"
              render={({ field: secondaryField }) => (
                <SkillSelectSection
                  primarySkills={primaryField.value ?? []}
                  secondarySkills={secondaryField.value ?? []}
                  onPrimaryChange={primaryField.onChange}
                  onSecondaryChange={secondaryField.onChange}
                  primaryError={errors.primarySkills?.message}
                />
              )}
            />
          )}
        />
      </VendorProfileSection>

      <VendorProfileSection title="Resume">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-primary/20 bg-primary/[0.02] cursor-pointer hover:border-primary/35 hover:bg-primary/[0.04] transition-colors"
        >
          <Upload size={24} className="text-primary mb-2" />
          <p className="font-bold text-primary dark:text-white text-sm">
            {resumeFile
              ? resumeFile.name
              : candidate.hasResume
                ? "Replace resume"
                : "Upload resume"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PDF or DOCX</p>
        </div>
        {resumeFile && (
          <button
            type="button"
            onClick={() => resumeMutation.mutate(resumeFile)}
            disabled={resumeMutation.isPending}
            className="mt-3 btn-filled !h-9 !px-5 !text-sm"
          >
            {resumeMutation.isPending ? "Uploading…" : "Upload resume"}
          </button>
        )}
      </VendorProfileSection>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saveMutation.isPending || !isDirty}
          className="btn-filled !h-10 !px-6 !text-sm"
        >
          {saveMutation.isPending ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="btn-tonal !h-10 !px-6 !text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
