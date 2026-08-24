export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-x-auto custom-scrollbar border border-gray-200 dark:border-gray-800 rounded-lg">
      <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-800 ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead className={`bg-gray-100 dark:bg-gray-800/90 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', hover = true, ...props }) {
  return (
    <tr 
      className={`${hover ? 'hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors' : ''} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th 
      scope="col" 
      className={`px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 ${className}`} {...props}>
      {children}
    </td>
  );
}
