import { Sparkles, Radio } from 'lucide-react'
import type { AuditMode } from '../types'

export function ModeBadge({ mode }: { mode: AuditMode }) {
  if (mode === 'demo') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-300">
        <Sparkles className="h-3.5 w-3.5" />
        DEMO DATA
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-300">
      <Radio className="h-3.5 w-3.5" />
      LIVE AUDIT
    </span>
  )
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 ring-red-300',
  high: 'bg-orange-100 text-orange-800 ring-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-300',
  low: 'bg-blue-100 text-blue-800 ring-blue-300',
  info: 'bg-slate-100 text-slate-700 ring-slate-300',
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.info}`}>
      {severity}
    </span>
  )
}

const IMPACT_STYLES: Record<string, string> = {
  high: 'bg-indigo-100 text-indigo-800 ring-indigo-300',
  medium: 'bg-sky-100 text-sky-800 ring-sky-300',
  low: 'bg-slate-100 text-slate-700 ring-slate-300',
}

export function ImpactBadge({ impact }: { impact: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${IMPACT_STYLES[impact] ?? IMPACT_STYLES.low}`}>
      {impact} impact
    </span>
  )
}
