import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getProfessionalsByArea } from '@/lib/actions/professionals'

const mockArea = { id: 'area-uuid-1', slug: 'sante-bien-etre' }
const mockProfession = { id: 'prof-uuid-1', slug: 'medecin', area_id: 'area-uuid-1' }
const mockProfessionals = [
  { id: 'p1', slug: 'dr-koné', business_name: 'Cabinet Koné', area_id: 'area-uuid-1', status: 'gold', recommendation_count: 5, signal_count: 3, avg_rating: 4.8, review_count: 10 },
]

function makeMockSupabase() {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'professional_areas') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockArea, error: null }),
            }),
          }),
        }
      }
      if (table === 'professions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfession, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'professionals') {
        return {
          select: vi.fn().mockReturnValue({
            count: 1,
            neq: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: mockProfessionals, count: 1, error: null }),
          }),
        }
      }
    }),
  }
}

describe('getProfessionalsByArea', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockResolvedValue(makeMockSupabase())
  })

  it('returns professionals filtered by area slug', async () => {
    const result = await getProfessionalsByArea('sante-bien-etre')
    expect(result.professionals).toHaveLength(1)
    expect(result.professionals[0].slug).toBe('dr-koné')
  })

  it('returns empty when area slug not found', async () => {
    ;(createClient as any).mockResolvedValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'professional_areas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
              }),
            }),
          }
        }
      }),
    })
    const result = await getProfessionalsByArea('does-not-exist')
    expect(result.professionals).toEqual([])
    expect(result.totalCount).toBe(0)
  })
})
