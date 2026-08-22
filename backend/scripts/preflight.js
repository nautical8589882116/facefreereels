// Startup preflight: fail loudly and clearly when required configuration is
// missing, instead of letting `prisma migrate deploy` die with a schema
// validation dump (or the server boot and misbehave later).
//
// Dependency-free on purpose: this runs after `npm prune --omit=dev`.

const REQUIRED = [
  ['DATABASE_URL', 'PostgreSQL connection string (append ?sslmode=require on Azure)'],
  ['JWT_SECRET', 'signing key for access tokens (32+ random chars)'],
  ['JWT_REFRESH_SECRET', 'signing key for refresh tokens (32+ random chars)'],
]

// Optional: each gates one feature, and the app runs fine without it.
const OPTIONAL = [
  ['ANTHROPIC_API_KEY', 'AI caption generation'],
  ['RAZORPAY_KEY_ID', 'payments'],
  ['CLOUDINARY_CLOUD_NAME', 'asset uploads'],
  ['TWILIO_SID', 'OTP over SMS (global)'],
  ['FAST2SMS_API_KEY', 'OTP over SMS (India)'],
]

const missing = REQUIRED.filter(([name]) => !process.env[name])

if (missing.length > 0) {
  console.error('')
  console.error('='.repeat(72))
  console.error('STARTUP ABORTED - required configuration is missing')
  console.error('='.repeat(72))
  for (const [name, why] of missing) {
    console.error(`  MISSING  ${name}`)
    console.error(`           ${why}`)
  }
  console.error('')
  console.error('On Azure App Service set these under:')
  console.error('  Configuration -> Application settings -> New application setting')
  console.error('(then Save; the app restarts automatically)')
  console.error('='.repeat(72))
  console.error('')
  process.exit(1)
}

// Login is impossible without an SMS provider, so call it out explicitly.
if (!process.env.TWILIO_SID && !process.env.FAST2SMS_API_KEY) {
  console.warn(
    'WARNING: neither TWILIO_SID nor FAST2SMS_API_KEY is set - OTPs will be ' +
      'stored but never delivered, so no one can log in.'
  )
}

const disabled = OPTIONAL.filter(([name]) => !process.env[name]).map(
  ([name, feature]) => `${feature} (${name})`
)
if (disabled.length > 0) {
  console.log(`Preflight OK. Disabled features: ${disabled.join(', ')}`)
} else {
  console.log('Preflight OK. All features configured.')
}
