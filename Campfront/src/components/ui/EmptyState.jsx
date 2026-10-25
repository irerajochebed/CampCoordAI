export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-3 text-slate-400 dark:text-slate-500">
          {icon}
        </div>
      )}
      
      {title && (
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{title}</h3>
      )}
      
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">{description}</p>
      )}
      
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
