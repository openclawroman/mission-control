import { describe, expect, it } from 'vitest'
import { dedupeAgentsByCanonicalKey, getAgentCanonicalKey, normalizeAgentKey } from '../agent-canonical'

describe('agent-canonical helpers', () => {
  it('normalizes case and punctuation in agent keys', () => {
    expect(normalizeAgentKey(' Main ')).toBe('main')
    expect(normalizeAgentKey('lead 424a')).toBe('lead-424a')
  })

  it('prefers openclawId when deriving the canonical key', () => {
    expect(getAgentCanonicalKey({ id: 1, name: 'Main', config: { openclawId: 'workspace-main' } })).toBe('workspace-main')
  })

  it('deduplicates case-variant agents by canonical key', () => {
    const agents = dedupeAgentsByCanonicalKey([
      { id: 1, name: 'Main' },
      { id: 2, name: 'main' },
      { id: 3, name: 'Reviewer' },
    ])

    expect(agents).toHaveLength(2)
    expect(agents.map((agent) => agent.name)).toEqual(['Main', 'Reviewer'])
  })
})

