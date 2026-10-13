// Reusable skeleton loading components for Developer Workstation

export function SkeletonBox({ className = "" }) {
  return <div className={`bg-[#17202e] animate-pulse rounded-[2px] ${className}`} />;
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-[#111621] border border-[#20293a] rounded-sm overflow-hidden">
      <SkeletonBox className="h-44 rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-5 h-5 rounded-sm" />
          <SkeletonBox className="w-24 h-3 rounded-[2px]" />
          <SkeletonBox className="w-16 h-3 rounded-[2px] ml-auto" />
        </div>
        <SkeletonBox className="w-3/4 h-4 rounded-[2px]" />
        <SkeletonBox className="w-full h-3 rounded-[2px]" />
        <SkeletonBox className="w-5/6 h-3 rounded-[2px]" />
        <div className="flex gap-1.5">
          <SkeletonBox className="w-14 h-4 rounded-[2px]" />
          <SkeletonBox className="w-16 h-4 rounded-[2px]" />
          <SkeletonBox className="w-12 h-4 rounded-[2px]" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#1b2332]">
          <div className="flex gap-3">
            <SkeletonBox className="w-8 h-4 rounded-[2px]" />
            <SkeletonBox className="w-8 h-4 rounded-[2px]" />
          </div>
          <div className="flex gap-2">
            <SkeletonBox className="w-14 h-6 rounded-sm" />
            <SkeletonBox className="w-14 h-6 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeveloperCardSkeleton() {
  return (
    <div className="bg-[#111621] border border-[#20293a] rounded-sm p-4 space-y-3">
      <div className="flex items-start gap-3">
        <SkeletonBox className="w-10 h-10 rounded-sm flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="w-28 h-3.5 rounded-[2px]" />
          <SkeletonBox className="w-full h-2.5 rounded-[2px]" />
          <SkeletonBox className="w-3/4 h-2.5 rounded-[2px]" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <SkeletonBox className="w-14 h-4 rounded-[2px]" />
        <SkeletonBox className="w-16 h-4 rounded-[2px]" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[#1b2332]">
        <SkeletonBox className="w-20 h-3 rounded-[2px]" />
        <SkeletonBox className="w-16 h-6 rounded-sm" />
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 bg-[#111621] border border-[#20293a] rounded-sm">
      <SkeletonBox className="w-8 h-8 rounded-sm flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <SkeletonBox className="w-3/4 h-3.5 rounded-[2px]" />
        <SkeletonBox className="w-1/4 h-2.5 rounded-[2px]" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-[#10151f] border border-[#20293b] rounded-sm p-5 space-y-5">
      <div className="flex items-start gap-4">
        <SkeletonBox className="w-16 h-16 rounded-sm flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="w-40 h-4 rounded-[2px]" />
          <SkeletonBox className="w-full h-3 rounded-[2px]" />
          <SkeletonBox className="w-2/3 h-3 rounded-[2px]" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[#1c2435]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5 text-center">
            <SkeletonBox className="w-12 h-5 mx-auto rounded-[2px]" />
            <SkeletonBox className="w-16 h-2.5 mx-auto rounded-[2px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function StoryItemSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <SkeletonBox className="w-14 h-14 rounded-sm" />
      <SkeletonBox className="w-10 h-2 rounded-[2px]" />
    </div>
  );
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
