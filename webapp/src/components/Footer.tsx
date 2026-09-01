import { appConfig } from '@/lib/env'

export default function Footer() {
  return (
    <footer className="hidden px-8 pb-6 pt-2 md:block">
      <div className="mx-auto flex max-w-content items-center justify-between rounded-2xl border border-white/50 bg-white/50 px-5 py-3 text-caption text-stone backdrop-blur-sm">
        <span className="font-medium text-graphite">{appConfig.appName}</span>
        <div className="inline-flex items-center gap-3">
          <a className="transition-colors hover:text-graphite" href="/privacy-policy.html">
            Privacy
          </a>
          <a className="transition-colors hover:text-graphite" href="/terms-of-service.html">
            Terms
          </a>
          <a className="transition-colors hover:text-graphite" href="/data-deletion.html">
            Data deletion
          </a>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success" />
            {new Date().getFullYear()} · Creative workspace
          </span>
        </div>
      </div>
    </footer>
  )
}
