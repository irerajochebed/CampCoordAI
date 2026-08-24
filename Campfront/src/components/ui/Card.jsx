export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', action, ...props }) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between text-gray-900 dark:text-white ${className}`} {...props}>
      <div className="flex-1">{children}</div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-lg font-bold text-gray-900 dark:text-white ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-gray-700 dark:text-gray-300 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-4 text-gray-900 dark:text-gray-100 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 rounded-b-lg text-gray-900 dark:text-gray-100 ${className}`} {...props}>
      {children}
    </div>
  );
}
