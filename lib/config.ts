// Environment configuration
export const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

// Helper function to get callback URLs
export function getCallbackUrl(path: string = "/auth/callback") {
  return `${config.siteUrl}${path}`
}

// Helper function to get dashboard URL
export function getDashboardUrl() {
  return `${config.siteUrl}/dashboard`
}
