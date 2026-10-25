import { forwardRef } from 'react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 shadow-xs',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 shadow-xs',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-2 focus:ring-rose-500 shadow-xs',
    warning: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 shadow-xs',
    outline: 'border border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40',
    ghost: 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
  };
  
  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-base',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && iconPosition === 'left' && !loading && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && !loading && <span className="ml-2">{icon}</span>}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
