import { z } from 'zod'

export function primary() {
  return z.number().int().positive().describe('Primary key, auto-incremented')
}