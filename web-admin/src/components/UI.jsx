import React from 'react';
import clsx from 'clsx';

export const inputClass =
  'w-full min-h-9 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5';

export const labelClass =
  'text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500';

export const tableHeaderClass =
  'border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500';

export const tableCellClass =
  'border-b border-slate-100 px-4 py-2.5 align-top text-[13px] text-slate-700';

const buttonVariants = {
  primary: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 hover:border-slate-800',
  secondary: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
  danger: 'border-red-200 bg-white text-red-700 hover:bg-red-50 hover:border-red-300',
  success: 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700',
};

const badgeVariants = {
  slate: 'border-slate-200 bg-slate-50 text-slate-600',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-red-200 bg-red-50 text-red-700',
};

export const Button = ({ children, variant = 'primary', className, isLoading, ...props }) => (
  <button
    className={clsx(
      'inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
      buttonVariants[variant] || buttonVariants.primary,
      className
    )}
    disabled={isLoading || props.disabled}
    {...props}
  >
    {isLoading ? 'Working...' : children}
  </button>
);

export const Card = ({ children, className }) => <div className={className}>{children}</div>;

export const Badge = ({ children, variant = 'slate', className }) => (
  <span
    className={clsx(
      'inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide',
      badgeVariants[variant] || badgeVariants.slate,
      className
    )}
  >
    {children}
  </span>
);

export const PageHeader = ({ eyebrow, breadcrumb, title, action, actions }) => (
  <div className="border-b border-slate-200 px-5 py-3.5">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {(eyebrow || breadcrumb) && (
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{eyebrow || breadcrumb}</p>
        )}
        <h1 className="mt-0.5 text-[16px] font-semibold tracking-[-0.01em] text-slate-900">{title}</h1>
      </div>
      {(actions || action) && <div className="shrink-0">{actions || action}</div>}
    </div>
  </div>
);

export const ToolbarIconButton = ({ children, className, active, ...props }) => (
  <button
    className={clsx(
      'inline-flex h-8 w-8 items-center justify-center rounded-md border text-slate-400 transition',
      active
        ? 'border-slate-300 bg-slate-100 text-slate-700'
        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

export const Field = ({ label, className, children }) => (
  <label className={clsx('flex flex-col gap-1', className)}>
    <span className={labelClass}>{label}</span>
    {children}
  </label>
);

export const Banner = ({ tone = 'error', children, className }) => (
  <div
    className={clsx(
      'mx-4 mt-4 rounded-md border px-3 py-2.5 text-[13px]',
      tone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-red-200 bg-red-50 text-red-700',
      className
    )}
  >
    {children}
  </div>
);
