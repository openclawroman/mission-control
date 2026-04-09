export function normalizeAgentKey(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getAgentCanonicalKey(agent: {
  id?: number | string
  name?: string
  openclawId?: string
  config?: any
} | null | undefined): string {
  if (!agent || typeof agent !== 'object') return ''

  const config = agent.config && typeof agent.config === 'object' ? agent.config : null
  const openclawId =
    typeof agent.openclawId === 'string' && agent.openclawId.trim()
      ? agent.openclawId
      : typeof config?.openclawId === 'string' && config.openclawId.trim()
        ? config.openclawId
        : ''

  return normalizeAgentKey(openclawId || agent.name || agent.id || '')
}

export function dedupeAgentsByCanonicalKey<T extends {
  id?: number | string
  name?: string
  openclawId?: string
  config?: any
}>(agents: T[]): T[] {
  const seen = new Set<string>()
  const result: T[] = []

  for (const agent of agents) {
    const key = getAgentCanonicalKey(agent)
    if (key && seen.has(key)) continue
    if (key) seen.add(key)
    result.push(agent)
  }

  return result
}

