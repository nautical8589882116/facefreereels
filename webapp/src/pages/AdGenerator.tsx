import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Camera,
  Check,
  Copy,
  Download,
  Eye,
  MessageCircle,
  MessagesSquare,
  PlaySquare,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react'
import { toast } from 'sonner'
import { appConfig } from '@/lib/env'
import { cn } from '@/lib/utils'

type Objective = 'awareness' | 'engagement' | 'conversions'
type Platform = 'Instagram' | 'Facebook' | 'YouTube'

interface GeneratedVariation {
  id: number
  platform: Platform
  headline: string
  body: string
  cta: string
  score: number
}

const objectives: Array<{
  id: Objective
  label: string
  caption: string
  icon: React.ElementType
}> = [
  { id: 'awareness', label: 'Awareness', caption: 'Introduce the product to new buyers.', icon: Eye },
  { id: 'engagement', label: 'Engagement', caption: 'Start conversations and repeat visits.', icon: MessageCircle },
  { id: 'conversions', label: 'Conversions', caption: 'Move prospects toward trials or demos.', icon: Target },
]

const platformConfig: Record<Platform, { icon: React.ElementType; accent: string; formats: string[] }> = {
  Instagram: { icon: Camera, accent: '#E4405F', formats: ['Reel', 'Story', 'Carousel'] },
  Facebook: { icon: MessagesSquare, accent: '#1877F2', formats: ['Feed', 'Page post', 'Story'] },
  YouTube: { icon: PlaySquare, accent: '#FF0000', formats: ['Shorts', 'Community', 'Video ad'] },
}

const tones = ['Minimal', 'Friendly', 'Confident', 'Premium']
const ctas = ['Book a demo', 'Start free', 'Get started', 'See examples']

function buildCopy(
  objective: Objective,
  campaignName: string,
  productDescription: string,
  enabledPlatforms: Platform[],
  tone: string,
  cta: string
): GeneratedVariation[] {
  const base = campaignName.trim() || appConfig.appName
  const product = productDescription.trim() || `${appConfig.appName} helps teams launch campaigns faster.`

  const headlineByObjective: Record<Objective, string[]> = {
    awareness: [
      `${base} is ready for modern restaurants`,
      `A cleaner way to launch digital menu campaigns`,
      `Show guests a better first interaction`,
    ],
    engagement: [
      `Turn every scan into a conversation`,
      `Give guests a reason to come back`,
      `Make your menu updates worth sharing`,
    ],
    conversions: [
      `Launch your digital menu campaign today`,
      `Go from idea to active campaign in minutes`,
      `Convert more guests with simpler menu access`,
    ],
  }

  return enabledPlatforms.flatMap((platform) =>
    headlineByObjective[objective].map((headline, index) => ({
      id: index + 1,
      platform,
      headline,
      body:
        index === 0
          ? `${product} Keep the message ${tone.toLowerCase()}, clear, and easy to act on.`
          : `${appConfig.appName} helps operators publish useful updates without a heavy creative process.`,
      cta,
      score: 92 - index * 4,
    }))
  )
}

function SectionTitle({ label, detail }: { label: string; detail?: string }) {
  return (
    <div>
      <h2 className="text-h3 text-warm-black">{label}</h2>
      {detail && <p className="mt-1 text-body-sm text-stone">{detail}</p>}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-semibold text-warm-black">{children}</label>
}

function PlatformButton({
  platform,
  enabled,
  onToggle,
}: {
  platform: Platform
  enabled: boolean
  onToggle: () => void
}) {
  const Icon = platformConfig[platform].icon
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex h-14 items-center gap-3 rounded-card border px-4 text-left transition-all',
        enabled ? 'border-[var(--app-accent)] bg-peach shadow-xs' : 'border-linen bg-white hover:border-sand'
      )}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: platformConfig[platform].accent }}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-warm-black">{platform}</span>
        <span className="block truncate text-caption text-stone">{platformConfig[platform].formats.join(', ')}</span>
      </span>
      {enabled && <Check size={18} className="text-[var(--app-accent)]" />}
    </button>
  )
}

function PreviewCard({
  campaignName,
  objective,
  cta,
  enabledPlatforms,
}: {
  campaignName: string
  objective: Objective
  cta: string
  enabledPlatforms: Platform[]
}) {
  const primaryPlatform = enabledPlatforms[0] || 'Instagram'
  const PlatformIcon = platformConfig[primaryPlatform].icon

  return (
    <div className="rounded-card border border-linen bg-white p-5 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex size-9 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: platformConfig[primaryPlatform].accent }}
          >
            <PlatformIcon size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-warm-black">{primaryPlatform} preview</p>
            <p className="text-caption text-stone">Generated copy frame</p>
          </div>
        </div>
        <span className="rounded-tag bg-success-light px-2.5 py-1 text-caption font-semibold text-success">
          Ready
        </span>
      </div>

      <div className="rounded-[1rem] border border-linen bg-cream p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="size-8 rounded-full bg-[var(--app-accent)]" />
          <div>
            <p className="text-sm font-semibold text-warm-black">{appConfig.appName}</p>
            <p className="text-caption text-stone">Sponsored</p>
          </div>
        </div>
        <div className="mb-4 rounded-xl bg-white p-4 shadow-xs">
          <p className="text-h3 text-warm-black">
            {campaignName.trim() || 'Launch a cleaner digital menu campaign'}
          </p>
          <p className="mt-2 text-body-sm text-stone">
            A {objective} focused ad with concise copy, clear positioning, and a direct next step.
          </p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-button bg-[var(--app-accent)] px-4 text-sm font-semibold text-white">
          {cta}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}

function ResultCard({ item }: { item: GeneratedVariation }) {
  const copyText = `${item.headline}\n\n${item.body}\n\n${item.cta}`
  const Icon = platformConfig[item.platform].icon

  const copy = async () => {
    await navigator.clipboard.writeText(copyText)
    toast.success('Copy saved to clipboard')
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-card border border-linen bg-white p-5 shadow-card"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex size-8 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: platformConfig[item.platform].accent }}
          >
            <Icon size={15} />
          </span>
          <div>
            <p className="text-sm font-semibold text-warm-black">{item.platform}</p>
            <p className="text-caption text-stone">Quality score {item.score}</p>
          </div>
        </div>
        <button
          onClick={copy}
          className="rounded-button border border-linen p-2 text-stone transition-colors hover:text-warm-black"
          title="Copy"
        >
          <Copy size={16} />
        </button>
      </div>
      <h3 className="text-h3 text-warm-black">{item.headline}</h3>
      <p className="mt-3 text-body-sm text-stone">{item.body}</p>
      <div className="mt-4 inline-flex rounded-tag bg-peach px-3 py-1 text-caption font-semibold text-[var(--app-accent)]">
        {item.cta}
      </div>
    </motion.article>
  )
}

export default function AdGenerator() {
  const [objective, setObjective] = useState<Objective>('conversions')
  const [campaignName, setCampaignName] = useState('Restaurant digital menu launch')
  const [productDescription, setProductDescription] = useState(
    `${appConfig.appName} helps restaurants, cafes, and hotels create QR menu campaigns without complex design work.`
  )
  const [tone, setTone] = useState('Minimal')
  const [cta, setCta] = useState('Book a demo')
  const [platforms, setPlatforms] = useState<Record<Platform, boolean>>({
    Instagram: true,
    Facebook: true,
    YouTube: false,
  })
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<GeneratedVariation[]>([])

  const enabledPlatforms = useMemo(
    () => (Object.keys(platforms) as Platform[]).filter((platform) => platforms[platform]),
    [platforms]
  )

  const togglePlatform = (platform: Platform) => {
    setPlatforms((prev) => ({ ...prev, [platform]: !prev[platform] }))
  }

  const generate = () => {
    if (!enabledPlatforms.length) {
      toast.error('Select at least one platform')
      return
    }

    setGenerating(true)
    window.setTimeout(() => {
      setResults(buildCopy(objective, campaignName, productDescription, enabledPlatforms, tone, cta))
      setGenerating(false)
      toast.success('Ad copy generated')
    }, 700)
  }

  const copyAll = async () => {
    if (!results.length) return
    await navigator.clipboard.writeText(results.map((item) => `${item.platform}: ${item.headline}\n${item.body}\n${item.cta}`).join('\n\n'))
    toast.success('All generated copy saved to clipboard')
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Active platforms', value: enabledPlatforms.length, icon: Sparkles },
          { label: 'Objective', value: objectives.find((item) => item.id === objective)?.label || 'Conversions', icon: Target },
          { label: 'Drafts generated', value: results.length || 0, icon: BarChart3 },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-card border border-linen bg-white p-5 shadow-xs">
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-peach text-[var(--app-accent)]">
                <Icon size={18} />
              </div>
              <p className="text-caption font-medium uppercase text-stone">{item.label}</p>
              <p className="mt-1 text-data-md text-warm-black">{item.value}</p>
            </div>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="rounded-card border border-linen bg-white p-5 shadow-card md:p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <SectionTitle
              label="Creative brief"
              detail="Keep the prompt compact, specific, and tied to a measurable outcome."
            />
          </div>

          <div className="space-y-6">
            <div>
              <FieldLabel>Campaign objective</FieldLabel>
              <div className="grid gap-3 md:grid-cols-3">
                {objectives.map((item) => {
                  const Icon = item.icon
                  const active = objective === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setObjective(item.id)}
                      className={cn(
                        'min-h-[116px] rounded-card border p-4 text-left transition-all',
                        active ? 'border-[var(--app-accent)] bg-peach shadow-xs' : 'border-linen bg-white hover:border-sand'
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <Icon size={20} className={active ? 'text-[var(--app-accent)]' : 'text-stone'} />
                        {active && <Check size={17} className="text-[var(--app-accent)]" />}
                      </div>
                      <p className="text-sm font-semibold text-warm-black">{item.label}</p>
                      <p className="mt-1 text-caption text-stone">{item.caption}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Campaign name</FieldLabel>
                <input
                  value={campaignName}
                  onChange={(event) => setCampaignName(event.target.value)}
                  className="h-11 w-full rounded-button border border-linen bg-cream px-3 text-sm text-warm-black outline-none transition-all focus:border-[var(--app-accent)] focus:shadow-input-focus"
                />
              </div>
              <div>
                <FieldLabel>Call to action</FieldLabel>
                <select
                  value={cta}
                  onChange={(event) => setCta(event.target.value)}
                  className="h-11 w-full rounded-button border border-linen bg-cream px-3 text-sm text-warm-black outline-none transition-all focus:border-[var(--app-accent)] focus:shadow-input-focus"
                >
                  {ctas.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel>Product context</FieldLabel>
              <textarea
                value={productDescription}
                onChange={(event) => setProductDescription(event.target.value)}
                rows={5}
                className="w-full resize-none rounded-card border border-linen bg-cream px-3 py-3 text-sm text-warm-black outline-none transition-all focus:border-[var(--app-accent)] focus:shadow-input-focus"
              />
            </div>

            <div>
              <FieldLabel>Tone</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {tones.map((item) => (
                  <button
                    key={item}
                    onClick={() => setTone(item)}
                    className={cn(
                      'h-9 rounded-tag border px-4 text-sm font-medium transition-colors',
                      tone === item
                        ? 'border-[var(--app-accent)] bg-peach text-[var(--app-accent)]'
                        : 'border-linen bg-white text-stone hover:text-warm-black'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-linen bg-white p-5 shadow-card">
            <SectionTitle label="Publishing mix" detail="Choose the channels for this run." />
            <div className="mt-5 space-y-3">
              {(Object.keys(platformConfig) as Platform[]).map((platform) => (
                <PlatformButton
                  key={platform}
                  platform={platform}
                  enabled={platforms[platform]}
                  onToggle={() => togglePlatform(platform)}
                />
              ))}
            </div>
            <button
              onClick={generate}
              disabled={generating}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-button bg-[var(--app-accent)] px-4 text-sm font-semibold text-white shadow-xs transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            >
              {generating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating ? 'Generating' : 'Generate copy'}
            </button>
          </div>

          <PreviewCard
            campaignName={campaignName}
            objective={objective}
            cta={cta}
            enabledPlatforms={enabledPlatforms}
          />
        </aside>
      </section>

      <section className="rounded-card border border-linen bg-white p-5 shadow-card md:p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <SectionTitle
            label="Generated copy"
            detail={results.length ? `${results.length} drafts ready to review.` : 'Generate copy to create platform-ready drafts.'}
          />
          <div className="flex gap-2">
            <button
              onClick={copyAll}
              disabled={!results.length}
              className="inline-flex h-10 items-center gap-2 rounded-button border border-linen bg-white px-3 text-sm font-semibold text-warm-black transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Copy size={15} />
              Copy all
            </button>
            <button
              onClick={() => toast.success('Export prepared')}
              disabled={!results.length}
              className="inline-flex h-10 items-center gap-2 rounded-button border border-linen bg-white px-3 text-sm font-semibold text-warm-black transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />
              Export
            </button>
          </div>
        </div>

        {results.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {results.map((item, index) => (
              <ResultCard key={`${item.platform}-${item.id}-${index}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-card border border-dashed border-sand bg-cream text-center">
            <Sparkles size={28} className="mb-3 text-[var(--app-accent)]" />
            <p className="text-sm font-semibold text-warm-black">No drafts yet</p>
            <p className="mt-1 max-w-sm text-body-sm text-stone">Fill the brief and generate a compact set of ad copy variations.</p>
          </div>
        )}
      </section>
    </div>
  )
}
