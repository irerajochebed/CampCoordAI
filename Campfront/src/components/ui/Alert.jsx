import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export default function Alert({ 
  type = 'info', 
  title, 
  message, 
  onClose,
  className = '' 
}) {
  const types = {
    success: {
      container: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      title: 'text-emerald-800 dark:text-emerald-300',
      message: 'text-emerald-700 dark:text-emerald-200'
    },
    error: {
      container: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
      icon: <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      title: 'text-rose-800 dark:text-rose-300',
      message: 'text-rose-700 dark:text-rose-200'
    },
    warning: {
      container: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
      icon: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      title: 'text-amber-800 dark:text-amber-300',
      message: 'text-amber-700 dark:text-amber-200'
    },
    info: {
      container: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
      icon: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      title: 'text-sky-800 dark:text-sky-300',
      message: 'text-sky-700 dark:text-sky-200'
    }
  };

  const config = types[type] || types.info;

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-xl ${config.container} ${className}`}>
      <div className="shrink-0 mt-0.5">{config.icon}</div>
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`text-sm font-bold mb-0.5 ${config.title}`}>{title}</h4>
        )}
        {message && (
          <p className={`text-xs sm:text-sm font-medium leading-relaxed ${config.message}`}>{message}</p>
        )}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
