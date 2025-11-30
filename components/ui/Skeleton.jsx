'use client';

/**
 * Reusable skeleton components for loading states
 */

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-skeleton"
          style={{
            width: i === lines - 1 ? '80%' : '100%',
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`p-4 bg-white rounded-lg shadow-sm ${className}`}>
      <div className="h-48 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-skeleton mb-4" />
      <div className="space-y-3">
        <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-skeleton" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ className = '' }) {
  return (
    <div
      className={`w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-100 rounded-full animate-skeleton ${className}`}
    />
  );
}

export function SkeletonButton({ className = '' }) {
  return (
    <div
      className={`h-10 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg animate-skeleton ${className}`}
    />
  );
}

export function SkeletonInput({ className = '' }) {
  return (
    <div
      className={`h-12 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg animate-skeleton ${className}`}
    />
  );
}

export function SkeletonTableRow({ columns = 5 }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-skeleton" />
        </td>
      ))}
    </tr>
  );
}
