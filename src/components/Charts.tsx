import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts'
import type { AuditReport, TrafficPoint } from '../types'

const COLORS = {
  indigo: '#4f46e5',
  emerald: '#059669',
  amber: '#d97706',
  slate: '#64748b',
}

export function TrafficChart({ data }: { data: TrafficPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: string) => v.slice(5)} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={40} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          labelFormatter={(v) => `Date: ${v}`}
        />
        <Line type="monotone" dataKey="impressions" stroke={COLORS.slate} strokeWidth={2} dot={false} name="Impressions" />
        <Line type="monotone" dataKey="clicks" stroke={COLORS.indigo} strokeWidth={2.5} dot={false} name="Clicks" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ScoreBreakdownChart({ scores }: { scores: AuditReport['scores'] }) {
  const data = [
    { name: 'Technical', score: scores.technical.score },
    { name: 'Local SEO', score: scores.local.score },
    { name: 'GEO Coverage', score: scores.geo.score },
    { name: 'AI Readiness', score: scores.aiReadiness.score },
  ]
  const colorFor = (s: number) => (s >= 75 ? COLORS.emerald : s >= 50 ? COLORS.amber : '#dc2626')

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} width={30} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.name} fill={colorFor(d.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function IssueSeverityRadar({ counts }: { counts: { severity: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={counts} outerRadius="75%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="severity" tick={{ fontSize: 11, fill: '#64748b' }} />
        <PolarRadiusAxis tick={{ fontSize: 10, fill: '#cbd5e1' }} />
        <Radar dataKey="count" stroke={COLORS.indigo} fill={COLORS.indigo} fillOpacity={0.35} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function KeywordPositionChart({ data }: { data: { keyword: string; position: number }[] }) {
  const sorted = [...data].sort((a, b) => a.position - b.position).slice(0, 8)
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" reversed domain={[1, 'dataMax']} tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis dataKey="keyword" type="category" width={140} tick={{ fontSize: 11, fill: '#334155' }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(v: unknown) => [`#${v}`, 'Position']}
        />
        <Bar dataKey="position" fill={COLORS.indigo} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
