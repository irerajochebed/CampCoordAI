export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-x-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
      <table className={`min-w-full divide-y divide-slate-200 dark:divide-slate-800 ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead className={`bg-slate-100/90 dark:bg-[#162544] ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`bg-white dark:bg-[#111D38] divide-y divide-slate-200 dark:divide-slate-800/80 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', hover = true, ...props }) {
  return (
    <tr 
      className={`${hover ? 'hover:bg-slate-50/80 dark:hover:bg-[#182B50] transition-colors duration-150' : ''} ${className}`}
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
      className={`px-5 py-3.5 text-left text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`px-5 py-3.5 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100 ${className}`} {...props}>
      {children}
    </td>
  );
}
