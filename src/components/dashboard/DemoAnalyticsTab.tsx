import { Star, MapPin, Phone, Clock } from 'lucide-react'
import type { DemoBusinessProfile } from '../../types'
import SectionCard from '../SectionCard'
import { TrafficChart, KeywordPositionChart } from '../Charts'
import KeywordTable from '../KeywordTable'

export default function DemoAnalyticsTab({ profile }: { profile: DemoBusinessProfile }) {
  const { gbp } = profile

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700 lg:col-span-3">
        The metrics below (rankings, clicks, impressions, reviews, GBP profile) are illustrative DEMO DATA meant to show
        what a real Search Console / Google Business Profile integration could surface. They are not fetched from any
        live API — the app never depends on Search Console or GBP for its core audit features.
      </div>

      <SectionCard title="Google Business Profile" icon={<MapPin className="h-4.5 w-4.5" />} className="lg:col-span-1">
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-slate-900">{gbp.businessName}</p>
            <p className="text-slate-500">{gbp.category}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-slate-900">{gbp.averageRating}</span>
            <span className="text-slate-400">({gbp.totalReviews} reviews)</span>
          </div>
          <div className="flex items-start gap-1.5 text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 flex-none text-slate-400" />
            <span>{gbp.address}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Phone className="h-4 w-4 flex-none text-slate-400" />
            <span>{gbp.phone}</span>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-slate-600">
              <Clock className="h-4 w-4 flex-none text-slate-400" />
              <span>Hours</span>
            </div>
            <ul className="ml-5.5 space-y-0.5 text-xs text-slate-500">
              {Object.entries(gbp.hours).map(([day, hours]) => (
                <li key={day} className="flex justify-between gap-3">
                  <span>{day}</span>
                  <span>{hours}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div>
              <p className="text-lg font-bold text-slate-900">{gbp.photosCount}</p>
              <p className="text-xs text-slate-400">Photos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{gbp.postsLast30Days}</p>
              <p className="text-xs text-slate-400">Posts/30d</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{gbp.qAndACount}</p>
              <p className="text-xs text-slate-400">Q&amp;A</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recent Reviews" className="lg:col-span-2">
        <ul className="space-y-3">
          {gbp.recentReviews.map((r, idx) => (
            <li key={idx} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">{r.author}</span>
                <span className="text-xs text-slate-400">
                  {r.platform} · {r.date}
                </span>
              </div>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                ))}
              </div>
              <p className="mt-1.5 text-sm text-slate-600">{r.text}</p>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Search Traffic (Last 30 Days)" subtitle="Clicks & impressions" className="lg:col-span-2">
        <TrafficChart data={profile.trafficHistory} />
      </SectionCard>

      <SectionCard title="Keyword Rankings" subtitle="Top keywords by position" className="lg:col-span-1">
        <KeywordPositionChart data={profile.keywordRankings} />
      </SectionCard>

      <SectionCard title="All Tracked Keywords" className="lg:col-span-3">
        <KeywordTable rows={profile.keywordRankings} />
      </SectionCard>
    </div>
  )
}
