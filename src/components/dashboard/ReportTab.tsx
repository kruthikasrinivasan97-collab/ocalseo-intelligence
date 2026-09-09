import { useState } from 'react'
import { Printer, Download, Loader2 } from 'lucide-react'
import type { AuditBundle } from '../../lib/api'
import { ModeBadge, SeverityBadge } from '../Badge'

export default function ReportTab({ bundle }: { bundle: AuditBundle }) {
  const { report } = bundle
  const [downloading, setDownloading] = useState(false)

  async function handleDownloadPdf() {
    setDownloading(true)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas-pro'),
      ])
      const node = document.getElementById('printable-report')
      if (!node) return

      const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const safeHost = report.rootUrl.replace(/^https?:\/\//, '').replace(/[^a-z0-9.-]/gi, '-')
      pdf.save(`localseo-intelligence-${safeHost}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">A condensed, print-friendly summary of the full audit.</p>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? 'Generating PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div id="printable-report" className="rounded-2xl border border-slate-200 bg-white p-8 print:border-0 print:p-0 print:shadow-none">
        <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">LocalSEO Intelligence — Audit Report</h1>
            <p className="mt-1 text-sm text-slate-500">{report.rootUrl}</p>
            <p className="text-xs text-slate-400">Generated {new Date(report.generatedAt).toLocaleString()}</p>
          </div>
          <ModeBadge mode={report.mode} />
        </div>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Scores</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <ScoreBlock label="Overall" score={report.scores.overall} />
            <ScoreBlock label="Technical" score={report.scores.technical.score} />
            <ScoreBlock label="Local SEO" score={report.scores.local.score} />
            <ScoreBlock label="GEO" score={report.scores.geo.score} />
            <ScoreBlock label="AI Readiness" score={report.scores.aiReadiness.score} />
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            All Issues ({report.allIssues.length})
          </h2>
          {report.allIssues.length === 0 ? (
            <p className="text-sm text-emerald-700">No issues found.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-1.5 pr-3">Severity</th>
                  <th className="py-1.5 pr-3">Issue</th>
                  <th className="py-1.5 pr-3">Category</th>
                  <th className="py-1.5 pr-3">Pages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.allIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td className="py-1.5 pr-3">
                      <SeverityBadge severity={issue.severity} />
                    </td>
                    <td className="py-1.5 pr-3 text-slate-800">{issue.title}</td>
                    <td className="py-1.5 pr-3 capitalize text-slate-500">{issue.category}</td>
                    <td className="py-1.5 pr-3 text-slate-500">{issue.affectedUrls.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Recommendations ({report.recommendations.length})
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {report.recommendations.map((rec) => (
              <li key={rec.id}>
                <span className="font-medium text-slate-900">{rec.title}</span> — {rec.description}{' '}
                <span className="text-xs text-slate-400">
                  ({rec.impact} impact, {rec.effort} effort)
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}

function ScoreBlock({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 text-center">
      <p className="text-2xl font-bold text-slate-900">{score}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
