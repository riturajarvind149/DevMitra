// Reusable skeleton loading components

export function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-800 animate-pulse rounded-xl ${className}`} />;
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <SkeletonBox className="h-44 rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-6 h-6 rounded-full" />
          <SkeletonBox className="w-24 h-3 rounded" />
          <SkeletonBox className="w-16 h-3 rounded ml-auto" />
        </div>
        <SkeletonBox className="w-3/4 h-4 rounded" />
        <SkeletonBox className="w-full h-3 rounded" />
        <SkeletonBox className="w-5/6 h-3 rounded" />
        <div className="flex gap-1.5">
          <SkeletonBox className="w-14 h-5 rounded-full" />
          <SkeletonBox className="w-16 h-5 rounded-full" />
          <SkeletonBox className="w-12 h-5 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <div className="flex gap-3">
            <SkeletonBox className="w-8 h-4 rounded" />
            <SkeletonBox className="w-8 h-4 rounded" />
          </div>
          <div className="flex gap-2">
            <SkeletonBox className="w-14 h-7 rounded-xl" />
            <SkeletonBox className="w-16 h-7 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeveloperCardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <SkeletonBox className="w-12 h-12 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="w-32 h-4 rounded" />
          <SkeletonBox className="w-full h-3 rounded" />
          <SkeletonBox className="w-3/4 h-3 rounded" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <SkeletonBox className="w-14 h-5 rounded-full" />
        <SkeletonBox className="w-16 h-5 rounded-full" />
        <SkeletonBox className="w-12 h-5 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-800">
        <SkeletonBox className="w-24 h-4 rounded" />
        <SkeletonBox className="w-20 h-8 rounded-xl" />
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl">
      <SkeletonBox className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="w-3/4 h-4 rounded" />
        <SkeletonBox className="w-1/4 h-3 rounded" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-start gap-5 mb-6">
        <SkeletonBox className="w-20 h-20 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <SkeletonBox className="w-48 h-5 rounded" />
          <SkeletonBox className="w-full h-3 rounded" />
          <SkeletonBox className="w-3/4 h-3 rounded" />
          <div className="flex gap-2">
            <SkeletonBox className="w-20 h-4 rounded" />
            <SkeletonBox className="w-24 h-4 rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 pt-5 border-t border-gray-800">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <SkeletonBox className="w-12 h-6 rounded mx-auto" />
            <SkeletonBox className="w-16 h-3 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-600">Loading…</p>
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5">
      {[...Array(count)].map((_, i) => <ProjectCardSkeleton key={i} />)}
    </div>
  );
}
