import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getAreasSortedByPopularity } from '@/lib/actions/taxonomy'

const mockAreas = [
  { id: '1', name: 'Construction', slug: 'batiment-travaux-publics', sort_order: 1 },
  { id: '2', name: 'Santé', slug: 'sante-bien-etre', sort_order: 2 },
  { id: '3', name: 'Digital', slug: 'digital-tech', sort_order: 3 },
  { id: '4', name: 'Juridique', slug: 'juridique-administratif', sort_order: 4 },
  { id: '5', name: 'Éducation', slug: 'education-formation', sort_order: 5 },
  { id: '6', name: 'Architecture', slug: 'architecture-design', sort_order: 6 },
  { id: '7', name: 'Mécanique', slug: 'mecanique-reparation', sort_order: 7 },
]

const mockProfessionalRows = [
  { area_id: '1' }, { area_id: '1' }, { area_id: '1' }, // 3 for id:1
  { area_id: '2' }, { area_id: '2' },                   // 2 for id:2
  { area_id: '7' }, { area_id: '7' }, { area_id: '7' }, { area_id: '7' }, // 4 for id:7
]

function makeMockSupabase() {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'professional_areas') {
        return { select: vi.fn().mockResolvedValue({ data: mockAreas, error: null }) }
      }
      if (table === 'professionals') {
        return {
          select: vi.fn().mockReturnValue({
            neq: vi.fn().mockResolvedValue({ data: mockProfessionalRows, error: null }),
          }),
        }
      }
    }),
  }
}

describe('getAreasSortedByPopularity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockResolvedValue(makeMockSupabase())
  })

  it('returns top 6 areas sorted by professional count descending', async () => {
    const result = await getAreasSortedByPopularity()
    expect(result).toHaveLength(6)
    expect(result[0].slug).toBe('mecanique-reparation')
    expect(result[0].professionalCount).toBe(4)
    expect(result[1].slug).toBe('batiment-travaux-publics')
    expect(result[1].professionalCount).toBe(3)
  })

  it('returns all areas when passed { all: true }', async () => {
    const result = await getAreasSortedByPopularity({ all: true })
    expect(result).toHaveLength(7)
  })

  it('returns [] when supabase returns no areas', async () => {
    ;(createClient as any).mockResolvedValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'professional_areas') {
          return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
        }
        if (table === 'professionals') {
          return {
            select: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
      }),
    })
    const result = await getAreasSortedByPopularity()
    expect(result).toEqual([])
  })
})
