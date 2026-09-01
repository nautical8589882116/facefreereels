import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  ChevronRight,
  Clapperboard,
  Copy,
  Layers3,
  Play,
  Send,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const platformTabs = ['Instagram', 'YouTube', 'Facebook']

const reelSteps = [
  { label: 'Brief', value: 'Diwali salon offer for working professionals' },
  { label: 'Script', value: '5 hooks, 3 CTAs, voiceover timed to 28s' },
  { label: 'Assets', value: 'Logo, service shots, QR booking screen' },
  { label: 'Schedule', value: 'Fri 7:30 PM across 3 channels' },
]

const metrics = [
  { label: 'Videos generated', value: '12.8K' },
  { label: 'Avg. production time', value: '7 min' },
  { label: 'Channels supported', value: '3' },
]

const features = [
  {
    icon: Wand2,
    title: 'Face-free reel generation',
    body: 'Turn a campaign brief, screenshots, and offer details into vertical videos with captions and voiceover.',
  },
  {
    icon: Copy,
    title: 'Ad copy that matches the cut',
    body: 'Generate hooks, captions, CTA variants, and platform-specific descriptions from the same product context.',
  },
  {
    icon: CalendarCheck,
    title: 'Publishing calendar',
    body: 'Plan campaigns by channel, objective, and creative status without moving between social dashboards.',
  },
  {
    icon: BarChart3,
    title: 'Campaign analytics',
    body: 'Track views, spend, leads, and platform mix from a single reporting surface built for small teams.',
  },
]

function ReelPreview() {
  const [active, setActive] = useState(platformTabs[0])

  return (
    <div className="relative mx-auto w-full max-w-[960px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0F1117] shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/58 sm:block">
          FaceFreeReels workspace
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.25fr]">
        <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-white/55">Generator</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Campaign to reel</h2>
            </div>
            <button className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-[#06B6D4] text-[#061116] transition-colors hover:bg-[#67E8F9]" aria-label="Play preview">
              <Play size={18} fill="currentColor" />
            </button>
          </div>

          <div className="space-y-3">
            {reelSteps.map((step, index) => (
              <div key={step.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs uppercase text-white/44">{step.label}</span>
                  <span className="font-mono text-xs text-[#F472B6]">0{index + 1}</span>
                </div>
                <p className="text-sm leading-6 text-white/82">{step.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 flex flex-wrap gap-2">
            {platformTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={cn(
                  'min-h-11 cursor-pointer rounded-full px-4 text-sm font-medium transition-colors',
                  active === tab
                    ? 'bg-white text-[#10131A]'
                    : 'border border-white/10 bg-white/[0.04] text-white/68 hover:text-white',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <div className="aspect-[9/16] overflow-hidden rounded-[24px] border border-white/10 bg-[#151923] p-3">
              <div className="flex h-full flex-col justify-between rounded-[18px] bg-[linear-gradient(160deg,#EC4899_0%,#8B5CF6_45%,#06B6D4_100%)] p-4">
                <div className="rounded-full bg-black/30 px-3 py-1 text-center text-xs font-medium text-white">
                  {active} Reel
                </div>
                <div>
                  <p className="mb-2 text-3xl font-bold leading-none text-white">Glow in 30 min</p>
                  <p className="text-sm leading-5 text-white/85">Book your slot from the QR menu today.</p>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/16 p-3 text-white">
                  <span className="text-xs">Auto captions</span>
                  <Clapperboard size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                  <Sparkles size={17} className="text-[#F472B6]" />
                  AI recommendation
                </div>
                <p className="text-sm leading-6 text-white/70">
                  Use the offer in the first 2 seconds, keep the CTA visual on screen, and publish after 7 PM for this audience.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {['Voiceover ready', 'Captions timed', 'CTA variants', 'Assets synced'].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-white/76">
                    <Check size={16} className="text-[#06B6D4]" />
                    {item}
                  </div>
                ))}
              </div>
              <button className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#EC4899] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#DB2777]">
                Generate next reel <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#080A0F] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-white text-[#0A0D12]">
            <Layers3 size={21} />
          </span>
          <span className="text-lg font-semibold">FaceFreeReels</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden min-h-11 cursor-pointer items-center rounded-full px-4 text-sm font-medium text-white/72 transition-colors hover:text-white sm:inline-flex">
            Sign in
          </Link>
          <a href="#demo" className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#0A0D12] transition-colors hover:bg-[#E8ECF3]">
            View demo <ChevronRight size={16} />
          </a>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 pb-14 pt-7 sm:px-8 lg:pb-20 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[0.88fr_1.12fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-white/72">
              <Sparkles size={16} className="text-[#F472B6]" />
              AI reels, ad copy, and scheduling in one workspace
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Create face-free reels that are ready to publish.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
              FaceFreeReels helps small teams turn offers, assets, and campaign briefs into short-form video ads with captions, voiceover, copy variants, and a publishing plan.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#demo" className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#EC4899] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#DB2777]">
                Build a sample campaign <ArrowRight size={17} />
              </a>
              <Link to="/login" className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/12 px-6 text-sm font-semibold text-white/78 transition-colors hover:bg-white/[0.06] hover:text-white">
                Open dashboard
              </Link>
            </div>
          </div>
          <div id="demo">
            <ReelPreview />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.035]">
        <div className="mx-auto grid max-w-7xl gap-0 px-5 sm:grid-cols-3 sm:px-8">
          {metrics.map((metric) => (
            <div key={metric.label} className="border-white/10 py-6 sm:border-r sm:px-8 first:sm:pl-0 last:sm:border-r-0">
              <p className="text-3xl font-bold text-white">{metric.value}</p>
              <p className="mt-1 text-sm text-white/56">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="mb-8 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase text-[#67E8F9]">Workflow</p>
          <h2 className="text-3xl font-bold tracking-normal sm:text-4xl">Everything after the idea, handled in one flow.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <article key={feature.title} className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5">
                <div className="mb-5 inline-flex size-11 items-center justify-center rounded-2xl bg-white text-[#0A0D12]">
                  <Icon size={21} />
                </div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/62">{feature.body}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:pb-20">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[28px] border border-white/10 bg-[#10131A] p-6 sm:p-8">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white/50">Campaign plan</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Weekend service push</h2>
              </div>
              <button className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-[#06B6D4] px-4 text-sm font-semibold text-[#061116] transition-colors hover:bg-[#67E8F9]">
                <Send size={16} /> Publish
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {['Hook testing', 'Offer reel', 'Retargeting CTA'].map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-mono text-xs text-[#F472B6]">Day {index + 1}</p>
                  <p className="mt-2 text-sm font-medium text-white">{item}</p>
                  <p className="mt-3 text-xs leading-5 text-white/55">Caption, voiceover, creative and platform export ready.</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white text-[#111827] p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase text-[#BE185D]">Launch status</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal">From blank brief to scheduled ads.</h2>
            <div className="mt-6 space-y-3">
              {['Generate reel sequence', 'Review copy variants', 'Sync assets', 'Schedule posts'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#F5F6F8] p-3 text-sm font-medium">
                  <Check size={17} className="text-[#059669]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
