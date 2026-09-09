import type { ReactNode } from 'react'

export default function SectionCard({
  title,
  subtitle,
  icon,
  actions,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</div>}
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}
