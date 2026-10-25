export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
    primary: 'bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60',
    success: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
    warning: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
    danger: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
    info: 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold tracking-wide ${variants[variant] || variants.default} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
