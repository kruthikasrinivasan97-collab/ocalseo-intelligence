import { Search } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400 opacity-20" />
        <span className="absolute inset-2 animate-ping rounded-full bg-indigo-400 opacity-30 [animation-delay:150ms]" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg">
          <Search className="h-6 w-6" />
        </div>
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Running your audit…</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Crawling pages, checking technical SEO signals, and scoring local &amp; AI search readiness. This usually takes a few seconds.
      </p>
    </div>
  )
}
