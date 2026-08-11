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
      container: 'bg-green-50 border-green-200',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      title: 'text-green-800',
      message: 'text-green-700'
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      title: 'text-red-800',
      message: 'text-red-700'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      title: 'text-yellow-800',
      message: 'text-yellow-700'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      title: 'text-blue-800',
      message: 'text-blue-700'
    }
  };

  const config = types[type];

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-lg ${config.container} ${className}`}>
      <div className="flex-shrink-0">{config.icon}</div>
      
      <div className="flex-1">
        {title && (
          <h4 className={`text-sm font-semibold mb-1 ${config.title}`}>{title}</h4>
        )}
        {message && (
          <p className={`text-sm ${config.message}`}>{message}</p>
        )}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
