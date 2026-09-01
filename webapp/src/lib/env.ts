const env = import.meta.env

function readEnv(key: string, fallback: string) {
  const value = env[key] as string | undefined
  return value?.trim() || fallback
}

export const appConfig = {
  appName: readEnv('VITE_APP_NAME', 'NHY-QR Ad Manager'),
  designSystem: readEnv('VITE_DESIGN_SYSTEM', 'google-stitch-minimal'),
  brandAccent: readEnv('VITE_BRAND_ACCENT', '#7C3AED'),
  brandAccentSoft: readEnv('VITE_BRAND_ACCENT_SOFT', '#F3EEFF'),
}

export function applyEnvTheme() {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.dataset.designSystem = appConfig.designSystem
  root.style.setProperty('--app-accent', appConfig.brandAccent)
  root.style.setProperty('--caramel', appConfig.brandAccent)
  root.style.setProperty('--peach', appConfig.brandAccentSoft)
}

export function appInitials() {
  return appConfig.appName
    .split(/\s|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A'
}
