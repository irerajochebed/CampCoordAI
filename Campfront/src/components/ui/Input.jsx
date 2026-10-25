import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({ 
  label, 
  error, 
  helperText,
  icon,
  iconPosition = 'left',
  rightAction,
  rightElement,
  showPasswordToggle = true,
  type = 'text',
  className = '', 
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword && showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
  const hasRightElement = Boolean(rightElement || rightAction || (isPassword && showPasswordToggle) || (icon && iconPosition === 'right'));

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          type={effectiveType}
          className={`
            w-full px-4 py-2.5 border rounded-lg transition-all
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            ${icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${hasRightElement ? 'pr-11' : ''}
            ${error 
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
            }
            disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        
        {isPassword && showPasswordToggle ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        ) : rightElement || rightAction ? (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement || rightAction}
          </div>
        ) : (
          icon && iconPosition === 'right' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
              {icon}
            </div>
          )
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
