import { LoadingSpinner } from "./loading-spinner"

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size={40} className="text-blue-600" />
        <p className="text-sm text-gray-600 animate-pulse">読み込み中...</p>
      </div>
    </div>
  )
}
