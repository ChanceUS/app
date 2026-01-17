// Production-ready auth utilities for handling scale

export class AuthRateLimiter {
  private static attempts = new Map<string, { count: number; lastAttempt: number }>()
  private static readonly MAX_ATTEMPTS = 5
  private static readonly WINDOW_MS = 15 * 60 * 1000 // 15 minutes

  static canAttempt(identifier: string): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)

    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now })
      return true
    }

    // Reset if outside window
    if (now - record.lastAttempt > this.WINDOW_MS) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now })
      return true
    }

    // Check if under limit
    if (record.count < this.MAX_ATTEMPTS) {
      record.count++
      record.lastAttempt = now
      return true
    }

    return false
  }

  static getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier)
    if (!record) return 0
    
    const elapsed = Date.now() - record.lastAttempt
    return Math.max(0, this.WINDOW_MS - elapsed)
  }
}

export function getRateLimitMessage(remainingTime: number): string {
  const minutes = Math.ceil(remainingTime / (1000 * 60))
  return `Too many attempts. Please wait ${minutes} minutes before trying again.`
}
