import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Issue } from '../types'
import { SeverityBadge } from './Badge'

export default function IssueList({ issues, emptyLabel = 'No issues found in this category.' }: { issues: Issue[]; emptyLabel?: string }) {
  if (issues.length === 0) {
    return <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">✓ {emptyLabel}</p>
  }

  return (
    <ul className="divide-y divide-slate-100">
      {issues.map((issue) => (
        <IssueRow key={issue.id} issue={issue} />
      ))}
    </ul>
  )
}

function IssueRow({ issue }: { issue: Issue }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="flex items-start gap-3">
          <SeverityBadge severity={issue.severity} />
          <div>
            <p className="text-sm font-medium text-slate-900">{issue.title}</p>
            <p className="text-xs text-slate-500">
              {issue.affectedUrls.length} page{issue.affectedUrls.length === 1 ? '' : 's'} affected
            </p>
          </div>
        </div>
        <ChevronDown className={`mt-1 h-4 w-4 flex-none text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <p>{issue.description}</p>
          {issue.affectedUrls.length > 0 && (
            <ul className="mt-2 space-y-1">
              {issue.affectedUrls.slice(0, 8).map((u) => (
                <li key={u} className="truncate font-mono text-xs text-slate-500">
                  {u}
                </li>
              ))}
              {issue.affectedUrls.length > 8 && (
                <li className="text-xs text-slate-400">+{issue.affectedUrls.length - 8} more</li>
              )}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}
