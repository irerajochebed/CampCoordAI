export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white dark:bg-[#111D38] text-slate-900 dark:text-slate-100 rounded-2xl shadow-xs border border-slate-200/90 dark:border-slate-800 transition-colors duration-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', action, ...props }) {
  return (
    <div className={`px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-900 dark:text-white ${className}`} {...props}>
      <div className="flex-1">{children}</div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-5 text-slate-800 dark:text-slate-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 rounded-b-2xl text-slate-700 dark:text-slate-300 ${className}`} {...props}>
      {children}
    </div>
  );
}
