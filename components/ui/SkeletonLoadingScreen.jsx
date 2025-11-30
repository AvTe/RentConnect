'use client';

export function SkeletonLoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Logo Skeleton */}
        <div className="w-64 h-24 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg animate-pulse"></div>

        {/* Loading Indicator */}
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 animate-pulse"
              style={{
                animationDelay: `${i * 150}ms`,
              }}
            ></div>
          ))}
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-3">
          <div className="h-6 w-48 bg-gradient-to-r from-slate-700 to-slate-600 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gradient-to-r from-slate-700 to-slate-600 rounded animate-pulse"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
