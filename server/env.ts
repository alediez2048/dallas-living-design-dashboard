import { config } from 'dotenv'

// Load local secrets for development from .env.local.
// On Railway the file is absent and env vars come from the platform,
// so this is a harmless no-op in production.
config({ path: '.env.local' })
