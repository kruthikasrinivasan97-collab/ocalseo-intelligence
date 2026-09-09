import { Bot, CheckCircle2, XCircle, Lightbulb } from 'lucide-react'
import type { AuditBundle } from '../../lib/api'
import SectionCard from '../SectionCard'
import { ScoreGauge } from '../ScoreGauge'

export default function AiReadinessTab({ bundle }: { bundle: AuditBundle }) {
  const { report } = bundle
  const ai = report.aiReadiness

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SectionCard title="AI Search Readiness" icon={<Bot className="h-4.5 w-4.5" />} subtitle="How easily AI answer engines can parse & cite this site" className="lg:col-span-1">
        <div className="flex justify-center py-2">
          <ScoreGauge score={report.scores.aiReadiness.score} size={150} />
        </div>
      </SectionCard>

      <SectionCard title="Structured Data Signals" className="lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-3">
          <SignalCheck label="Organization schema" ok={ai.hasOrganizationSchema} />
          <SignalCheck label="LocalBusiness schema" ok={ai.hasLocalBusinessSchema} />
          <SignalCheck label="FAQ schema" ok={ai.hasFaqSchema} />
        </div>
        {ai.structuredDataTypes.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-sm text-slate-500">All structured data types detected</p>
            <div className="flex flex-wrap gap-2">
              {ai.structuredDataTypes.map((t) => (
                <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs text-slate-600">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Content Structure Scores" className="lg:col-span-1">
        <div className="space-y-4">
          <ScoreRow label="Heading structure" value={ai.headingStructureScore} />
          <ScoreRow label="Answerable content" value={ai.answerableContentScore} />
        </div>
      </SectionCard>

      <SectionCard title="Recommendations to Improve AI Visibility" icon={<Lightbulb className="h-4.5 w-4.5" />} className="lg:col-span-2">
        {ai.notes.length === 0 ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">✓ Strong AI-readiness signals — no gaps found.</p>
        ) : (
          <ul className="space-y-2">
            {ai.notes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
                <Lightbulb className="mt-0.5 h-4 w-4 flex-none" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}

function SignalCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      {ok ? <CheckCircle2 className="h-4 w-4 flex-none" /> : <XCircle className="h-4 w-4 flex-none" />}
      <span>{label}</span>
    </div>
  )
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
