import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/services/http/auth";
import { ApiError } from "@/lib/apiClient";
import { APP_NAME } from "@/config/branding";
import { PortalAuthShell } from "@/components/portal/PortalAuthShell";
import { DevQuickLogin } from "@/dev/DevQuickLogin";
import { isReferralPortalRole } from "@/permissions";
import { referralPortalPostAuthPath } from "@/lib/loginRedirect";

const REFERRAL_HIGHLIGHTS = [
  { icon: "check_circle", text: "Open roles with referral bonuses" },
  { icon: "check_circle", text: "Resume upload & smart profile fill" },
  { icon: "check_circle", text: "Live pipeline & hire tracking" },
] as const;

const ReferralLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit } = useForm<{
    email: string;
    password: string;
  }>();
  const referralFrom = (
    location.state as { from?: { pathname?: string } } | null
  )?.from?.pathname;

  useEffect(() => {
    if (user && isReferralPortalRole(user.role)) {
      navigate(referralPortalPostAuthPath(user, referralFrom), {
        replace: true,
      });
    }
  }, [user, referralFrom, navigate]);

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    setAuthError(null);
    try {
      const session = await login(data.email, data.password);
      if (!isReferralPortalRole(session.user.role)) {
        await logout();
        if (session.user.role === "CANDIDATE") {
          setAuthError("Use the candidate portal to sign in.");
        } else if (session.user.role === "VENDOR") {
          setAuthError("Use the vendor portal to sign in.");
        } else {
          setAuthError(
            "This account cannot access the employee referral portal.",
          );
        }
        return;
      }
      navigate(referralPortalPostAuthPath(session.user, referralFrom), {
        replace: true,
      });
    } catch {
      setAuthError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalAuthShell
      theme="referral"
      portalLabel="Referral portal"
      heroTitle="Refer great people. Earn rewards when they join."
      heroHighlights={REFERRAL_HIGHLIGHTS}
      mobileHeroText="Browse open roles, submit referrals, and track every candidate you introduce."
      title={`Sign in to ${APP_NAME} Referrals`}
      subtitle="Use your company email and password — the same credentials as the main ATS for all staff roles."
      footer={
        <p className="text-xs text-center text-muted-foreground">
          After sign-in you can also open referrals from the main app sidebar.
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {authError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-800 text-sm font-medium border border-red-100">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            {authError}
          </div>
        )}
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            className="portal-field mt-1"
            {...register("email", { required: true })}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Password
          </label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="portal-field pr-12"
              {...register("password", { required: true })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="portal-btn-primary">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {import.meta.env.DEV && (
        <DevQuickLogin
          referralPortalOnly
          primaryOnly
          onError={(msg) => setAuthError(msg || null)}
          onLoggedIn={() =>
            navigate("/referral-portal/dashboard", { replace: true })
          }
        />
      )}
    </PortalAuthShell>
  );
};

export default ReferralLogin;
