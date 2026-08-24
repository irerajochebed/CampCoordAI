import { forwardRef } from 'react';

const Select = forwardRef(({ 
  label, 
  error, 
  helperText,
  options = [],
  placeholder = 'Select an option',
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        className={`
          w-full px-4 py-2.5 border rounded-lg transition-all
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
          ${error 
            ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
          }
          disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        <option value="" className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
