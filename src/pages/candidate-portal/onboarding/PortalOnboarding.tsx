import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { useToastStore } from "@/store/toastStore";
import { ApiError } from "@/lib/apiClient";
import { portalHomePath } from "@/lib/portalWorkflow";
import { CANDIDATE_PORTAL, isCandidatePortalPath, normalizeCandidatePortalReturnTo } from "@/lib/candidatePortalPaths";
import clsx from "clsx";
import { StitchLogo } from "@/components/branding/StitchLogo";
import {
  PortalPageLoading,
  PortalTwoColumnPage,
} from "@/components/portal/PortalTwoColumnPage";
import "./onboarding.css";

const requiredString = (label: string) =>
  z.string().min(1, `${label} is required`);

const schema = z.object({
  firstName: requiredString("First name"),
  lastName: requiredString("Last name"),
  phone: requiredString("Phone number"),
  location: requiredString("Location"),
  totalExperience: requiredString("Total experience"),
  currentCompany: requiredString("Current company"),
  currentCTC: requiredString("Current CTC"),
  expectedCTC: requiredString("Expected CTC"),
  noticePeriod: requiredString("Notice period"),
  pan: z
    .string()
    .min(1, "PAN is required")
    .refine(
      (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(v.trim()),
      "Enter a valid PAN",
    ),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  portfolio: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const STEPS = [
  { id: "welcome", title: "Welcome", icon: "waving_hand" },
  { id: "personal", title: "About you", icon: "person" },
  { id: "professional", title: "Experience", icon: "work" },
  { id: "resume", title: "Resume", icon: "description" },
  { id: "done", title: "Ready", icon: "celebration" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

const PortalOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isEditMode = location.pathname === `${CANDIDATE_PORTAL}/profile`;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [step, setStep] = useState<StepId>("welcome");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const returnTo =
    normalizeCandidatePortalReturnTo(searchParams.get("returnTo")) ||
    `${CANDIDATE_PORTAL}/dashboard`;
  const backFallback = isEditMode
    ? `${CANDIDATE_PORTAL}/dashboard`
    : isCandidatePortalPath(returnTo)
      ? returnTo
      : `${CANDIDATE_PORTAL}/dashboard`;

  const { data: portalMe, isLoading } = useQuery({
    queryKey: ["portal-me"],
    queryFn: api.portal.getMe,
  });

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!portalMe) return;
    if (portalMe.linked && portalMe.candidate) {
      const c = portalMe.candidate;
      const { firstName, lastName } = splitName(c.name);
      setHasResume(!!(c.hasResume || c.resumeFileName));
      reset({
        firstName,
        lastName,
        phone: c.phone ?? "",
        location: c.location ?? "",
        totalExperience: c.totalExperience ?? "",
        currentCompany: c.currentCompany ?? "",
        currentCTC: c.currentCTC ?? "",
        expectedCTC: c.expectedCTC ?? "",
        noticePeriod: c.noticePeriod ?? "",
        pan: c.pan ?? "",
        linkedin: c.linkedIn ?? "",
        portfolio: c.portfolio ?? "",
      });
      if (isEditMode) {
        setStep("personal");
      } else if (portalMe.profileComplete) {
        setStep("done");
      } else if (c.phone && c.location) {
        setStep(hasResume ? "resume" : "resume");
      }
    } else {
      const { firstName, lastName } = splitName(
        portalMe.user?.name ?? user?.name ?? "",
      );
      reset({
        firstName,
        lastName,
        phone: "",
        location: "",
        totalExperience: "",
        currentCompany: "",
        currentCTC: "",
        expectedCTC: "",
        noticePeriod: "",
        pan: "",
        linkedin: "",
        portfolio: "",
      });
    }
  }, [portalMe, user, reset, isEditMode]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const missingFields = portalMe?.missingFields ?? [];

  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const result = await api.portal.saveProfile({
        ...data,
        linkedIn: data.linkedin?.trim() || undefined,
        portfolio: data.portfolio?.trim() || undefined,
      });
      if (resumeFile) {
        return api.portal.uploadResume(resumeFile);
      }
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["portal-me"] });
      setHasResume(
        !!(result.candidate.hasResume || result.candidate.resumeFileName),
      );
      if (isEditMode) {
        addToast(
          result.profileComplete
            ? "Profile updated"
            : `Saved. Still needed: ${result.missingFields.join(", ")}`,
          result.profileComplete ? "success" : "info",
        );
        if (step === "resume") {
          navigate(backFallback, { replace: true });
        }
        return;
      }
      if (result.profileComplete) {
        addToast("Profile complete", "success");
        setStep("done");
      } else {
        addToast(
          `Saved. Still needed: ${result.missingFields.join(", ")}`,
          "info",
        );
      }
    },
    onError: (err: unknown) => {
      addToast(
        err instanceof ApiError ? err.message : "Failed to save",
        "error",
      );
    },
  });

  const inputClass = "portal-field";

  const visibleSteps = isEditMode
    ? STEPS.filter((s) => s.id !== "welcome" && s.id !== "done")
    : STEPS;

  const goNext = async () => {
    if (step === "welcome") {
      setStep("personal");
      return;
    }
    if (step === "personal") {
      const ok = await trigger([
        "firstName",
        "lastName",
        "phone",
        "location",
        "pan",
      ]);
      if (ok) setStep("professional");
      return;
    }
    if (step === "professional") {
      const ok = await trigger([
        "totalExperience",
        "currentCompany",
        "currentCTC",
        "expectedCTC",
        "noticePeriod",
      ]);
      if (ok) {
        saveMutation.mutate(getValues());
        setStep("resume");
      }
      return;
    }
    if (step === "resume") {
      if (!resumeFile && !hasResume) {
        addToast("Upload your resume to continue", "error");
        return;
      }
      saveMutation.mutate(getValues(), {
        onSuccess: (r) => {
          if (!isEditMode && r.profileComplete) setStep("done");
        },
      });
    }
  };

  const finish = () => {
    const path = isCandidatePortalPath(returnTo)
      ? returnTo
      : portalHomePath(portalMe);
    navigate(path, { replace: true });
  };

  if (isLoading) {
    return <PortalPageLoading label="Loading profile…" />;
  }

  return (
    <PortalTwoColumnPage
      back={{ fallback: backFallback }}
      hero={{
        eyebrow: isEditMode ? "Account" : "Welcome",
        title: isEditMode ? "My profile" : "Set up your profile",
        subtitle: isEditMode
          ? "Update your personal details, experience, and resume — the same information used when you apply."
          : "Recruiters use this information when you apply. It takes about 5 minutes.",
      }}
      sidebar={
        <div className="portal-dash-stack">
          <div className="portal-page-steps">
            {visibleSteps.map((s, i, arr) => {
              const isActive = step === s.id;
              const isComplete = arr.findIndex((x) => x.id === step) > i;
              return (
                <React.Fragment key={s.id}>
                  <div className="portal-page-step">
                    <button
                      type="button"
                      disabled={!isEditMode}
                      onClick={() => isEditMode && setStep(s.id)}
                      className={clsx(
                        "flex items-center gap-2",
                        isEditMode && "cursor-pointer hover:opacity-80",
                      )}
                    >
                      <span
                        className={clsx(
                          "portal-page-step__dot",
                          (isComplete || (!isEditMode && i < stepIndex)) &&
                            "portal-page-step__dot--done",
                          isActive && "portal-page-step__dot--active",
                        )}
                      >
                        {isComplete || (!isEditMode && i < stepIndex) ? (
                          <span className="material-symbols-outlined text-base">
                            check
                          </span>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="hidden sm:inline">{s.title}</span>
                    </button>
                  </div>
                  {i < arr.length - 1 && (
                    <span className="portal-page-step__sep" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <form
            onSubmit={handleSubmit(() => {})}
            className="portal-page-form space-y-6"
          >
        {step === "welcome" && (
          <div className="space-y-4 text-center py-4">
            <StitchLogo tone="primary" size="xl" className="justify-center" />
            <h1 className="text-2xl font-black text-slate-900">
              Let&apos;s set up your profile
            </h1>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Recruiters use this information when you apply. It takes about 5
              minutes. You can update it anytime from My profile.
            </p>
            {missingFields.length > 0 && portalMe?.linked && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
                Still required: {missingFields.join(", ")}
              </p>
            )}
          </div>
        )}

        {step === "personal" && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900">
              Personal details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  First name *
                </label>
                <input className={inputClass} {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Last name *
                </label>
                <input className={inputClass} {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Email
                </label>
                <input
                  className={clsx(inputClass, "bg-slate-50")}
                  value={user?.email ?? ""}
                  readOnly
                  disabled
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Phone *
                </label>
                <input className={inputClass} {...register("phone")} />
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Location *
                </label>
                <input
                  className={inputClass}
                  placeholder="City, country"
                  {...register("location")}
                />
                {errors.location && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.location.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  PAN *
                </label>
                <input
                  className={clsx(inputClass, "uppercase")}
                  maxLength={10}
                  {...register("pan")}
                />
                {errors.pan && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.pan.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === "professional" && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900">
              Experience & compensation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                [
                  ["totalExperience", "Total experience *", "e.g. 5 years"],
                  ["currentCompany", "Current company *", ""],
                  ["currentCTC", "Current CTC *", ""],
                  ["expectedCTC", "Expected CTC *", ""],
                  ["noticePeriod", "Notice period *", "e.g. 30 days"],
                ] as const
              ).map(([name, label, ph]) => (
                <div key={name}>
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    {label}
                  </label>
                  <input
                    className={inputClass}
                    placeholder={ph}
                    {...register(name)}
                  />
                  {errors[name] && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors[name]?.message}
                    </p>
                  )}
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  LinkedIn
                </label>
                <input className={inputClass} {...register("linkedin")} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Portfolio
                </label>
                <input className={inputClass} {...register("portfolio")} />
              </div>
            </div>
          </div>
        )}

        {step === "resume" && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900">Upload resume</h2>
            <p className="text-sm text-slate-600">
              PDF or DOCX, max 5 MB. Required before you can apply.
            </p>
            {hasResume && !resumeFile && (
              <p className="text-sm text-primary font-medium">
                Resume on file. Upload to replace.
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="w-full text-sm"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center py-6">
            <span className="material-symbols-outlined text-5xl text-primary">
              check_circle
            </span>
            <h2 className="text-xl font-black text-slate-900">
              You&apos;re all set
            </h2>
            <p className="text-sm text-slate-600">
              Browse open roles and submit your application.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                to={`${CANDIDATE_PORTAL}/jobs?tab=open`}
                className="btn-filled !h-10 !px-6 !text-sm"
              >
                Browse open roles
              </Link>
              <button
                type="button"
                onClick={finish}
                className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-700"
              >
                Go to home
              </button>
            </div>
          </div>
        )}

        {step !== "done" && !(isEditMode && step === "welcome") && (
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isEditMode ? step === "personal" : step === "welcome"}
              onClick={() => {
                const steps = isEditMode
                  ? STEPS.filter((s) => s.id !== "welcome" && s.id !== "done")
                  : STEPS;
                const idx = steps.findIndex((s) => s.id === step);
                const prev = steps[idx - 1];
                if (prev) setStep(prev.id);
              }}
              className="px-4 py-2 text-sm font-bold text-slate-500 disabled:opacity-30"
            >
              Back
            </button>
            <div className="flex gap-2">
              {isEditMode && (step === "professional" || step === "resume") && (
                <button
                  type="button"
                  onClick={() => saveMutation.mutate(getValues())}
                  disabled={saveMutation.isPending}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? "Saving…" : "Save changes"}
                </button>
              )}
              <button
                type="button"
                onClick={goNext}
                disabled={saveMutation.isPending}
                className="btn-filled !h-10 !px-6 !text-sm disabled:opacity-50"
              >
                {saveMutation.isPending
                  ? "Saving…"
                  : isEditMode && step === "resume"
                    ? "Save & close"
                    : step === "resume"
                      ? "Save & finish"
                      : "Continue"}
              </button>
            </div>
          </div>
        )}
          </form>
        </div>
      }
    />
  );
};

export default PortalOnboarding;
