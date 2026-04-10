import { describe, it, expect } from 'vitest'
import { resolveTaskImplementationTarget, resolveTaskHandoff } from '@/lib/task-routing'

describe('resolveTaskImplementationTarget', () => {
  it('returns explicit implementation target metadata when present', () => {
    const result = resolveTaskImplementationTarget({
      metadata: {
        implementation_repo: 'builderz-labs/mission-control',
        code_location: '/apps/api',
      },
    })

    expect(result).toEqual({
      implementation_repo: 'builderz-labs/mission-control',
      code_location: '/apps/api',
    })
  })

  it('supports legacy metadata keys for backward compatibility', () => {
    const result = resolveTaskImplementationTarget({
      metadata: {
        github_repo: 'builderz-labs/mission-control',
        path: '/packages/core',
      },
    })

    expect(result).toEqual({
      implementation_repo: 'builderz-labs/mission-control',
      code_location: '/packages/core',
    })
  })

  it('prefers explicit implementation target metadata over legacy fallback keys', () => {
    const result = resolveTaskImplementationTarget({
      metadata: {
        implementation_repo: 'builderz-labs/mission-control',
        github_repo: 'legacy/repo',
        code_location: '/apps/api',
        path: '/legacy/path',
      },
    })

    expect(result).toEqual({
      implementation_repo: 'builderz-labs/mission-control',
      code_location: '/apps/api',
    })
  })

  it('returns empty object for missing metadata', () => {
    expect(resolveTaskImplementationTarget({ metadata: null })).toEqual({})
  })

  it('returns normalized handoff metadata when present', () => {
    const result = resolveTaskHandoff({
      metadata: {
        handoff: {
          source_agent: 'Main',
          target_agent: 'Orchestrator',
          reason: 'Coordination needed',
          summary: 'Normalize the workspace path',
          context: 'The lead workspace still points at the hashed suffix.',
          desired_outcome: 'Use a canonical workspace alias.',
          constraints: ['Keep the existing workspace contents intact'],
          evidence: ['openclaw.json', 'workspace-lead/TOOLS.md'],
          next_step: 'Update references and refresh the runtime.',
          related_task_ids: [42],
          created_at: '2026-04-09T13:00:00.000Z',
        },
      },
    })

    expect(result).toEqual({
      source_agent: 'Main',
      target_agent: 'Orchestrator',
      reason: 'Coordination needed',
      summary: 'Normalize the workspace path',
      context: 'The lead workspace still points at the hashed suffix.',
      desired_outcome: 'Use a canonical workspace alias.',
      constraints: ['Keep the existing workspace contents intact'],
      evidence: ['openclaw.json', 'workspace-lead/TOOLS.md'],
      next_step: 'Update references and refresh the runtime.',
      related_task_ids: [42],
      created_at: '2026-04-09T13:00:00.000Z',
    })
  })

  it('falls back to legacy flat metadata keys for handoff', () => {
    const result = resolveTaskHandoff({
      metadata: {
        source_agent: 'Main',
        target_agent: 'Orchestrator',
        reason: 'Legacy handoff',
        summary: 'Use the old path mapping',
      },
    })

    expect(result).toEqual({
      source_agent: 'Main',
      target_agent: 'Orchestrator',
      reason: 'Legacy handoff',
      summary: 'Use the old path mapping',
    })
  })
})
