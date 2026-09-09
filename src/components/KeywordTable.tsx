import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { KeywordRanking } from '../types'

export default function KeywordTable({ rows }: { rows: KeywordRanking[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="pb-2 pr-3">Keyword</th>
            <th className="pb-2 pr-3">Position</th>
            <th className="pb-2 pr-3">Trend</th>
            <th className="pb-2 pr-3">Clicks</th>
            <th className="pb-2 pr-3">Impressions</th>
            <th className="pb-2 pr-3">CTR</th>
            <th className="pb-2 pr-3">Volume</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((k) => {
            const delta = k.previousPosition != null ? k.previousPosition - k.position : null
            return (
              <tr key={k.keyword}>
                <td className="py-2 pr-3 font-medium text-slate-800">{k.keyword}</td>
                <td className="py-2 pr-3 text-slate-600">#{k.position}</td>
                <td className="py-2 pr-3">
                  {delta == null ? (
                    <span className="text-slate-300">—</span>
                  ) : delta > 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="h-3.5 w-3.5" /> {delta}
                    </span>
                  ) : delta < 0 ? (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <TrendingDown className="h-3.5 w-3.5" /> {Math.abs(delta)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Minus className="h-3.5 w-3.5" />
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3 text-slate-600">{k.clicks}</td>
                <td className="py-2 pr-3 text-slate-600">{k.impressions.toLocaleString()}</td>
                <td className="py-2 pr-3 text-slate-600">{(k.ctr * 100).toFixed(1)}%</td>
                <td className="py-2 pr-3 text-slate-600">{k.searchVolume != null ? k.searchVolume.toLocaleString() : <span className="text-slate-300">—</span>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
