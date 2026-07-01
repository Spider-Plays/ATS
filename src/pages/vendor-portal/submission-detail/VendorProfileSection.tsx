import React from "react";
import clsx from "clsx";

type VendorProfileSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function VendorProfileSection({
  title,
  description,
  children,
  className,
}: VendorProfileSectionProps) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden bg-card",
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
        <h3 className="text-sm font-bold text-primary dark:text-white">{title}</h3>
        {description && (
          <p className="text-xs text-primary/50 dark:text-white/50 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function VendorProfileDetailCard({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="p-4 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-bold text-primary dark:text-white mt-1 break-words">
        {value?.trim() || "—"}
      </p>
    </div>
  );
}
