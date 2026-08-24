export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700',
    primary: 'bg-primary-100 dark:bg-primary-950/80 text-primary-900 dark:text-primary-200 border border-primary-200 dark:border-primary-800',
    success: 'bg-green-100 dark:bg-green-950/80 text-green-900 dark:text-green-200 border border-green-200 dark:border-green-800',
    warning: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800',
    danger: 'bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800',
    info: 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
