export type TaskMetadata = Record<string, unknown>

export interface TaskLike {
  metadata?: string | TaskMetadata | null
}

export interface TaskImplementationTarget {
  implementation_repo?: string
  code_location?: string
}

export interface TaskHandoff {
  source_agent: string
  target_agent: string
  reason: string
  summary: string
  context?: string
  desired_outcome?: string
  constraints?: string[]
  evidence?: string[]
  next_step?: string
  related_task_ids?: number[]
  created_at?: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function parseMetadata(metadata: TaskLike['metadata']): TaskMetadata {
  if (!metadata) return {}

  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as TaskMetadata
      }
      return {}
    } catch {
      return {}
    }
  }

  if (typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata
  }

  return {}
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => isNonEmptyString(item))
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number' && Number.isFinite(item) && item > 0)
}

export function resolveTaskImplementationTarget(task: TaskLike): TaskImplementationTarget {
  const metadata = parseMetadata(task.metadata)

  const implementationRepoCandidates = [
    metadata.implementation_repo,
    metadata.implementationRepo,
    metadata.github_repo,
  ]

  const codeLocationCandidates = [
    metadata.code_location,
    metadata.codeLocation,
    metadata.path,
  ]

  const implementation_repo = implementationRepoCandidates.find(isNonEmptyString)
  const code_location = codeLocationCandidates.find(isNonEmptyString)

  return {
    ...(implementation_repo ? { implementation_repo } : {}),
    ...(code_location ? { code_location } : {}),
  }
}

export function resolveTaskHandoff(task: TaskLike): TaskHandoff | null {
  const metadata = parseMetadata(task.metadata)
  const candidate = metadata.handoff && typeof metadata.handoff === 'object' && !Array.isArray(metadata.handoff)
    ? metadata.handoff as TaskMetadata
    : metadata

  const source_agent = [candidate.source_agent, metadata.source_agent, metadata.from_agent]
    .find(isNonEmptyString)
  const target_agent = [candidate.target_agent, metadata.target_agent, metadata.to_agent]
    .find(isNonEmptyString)
  const reason = [candidate.reason, metadata.reason, metadata.handoff_reason]
    .find(isNonEmptyString)
  const summary = [candidate.summary, metadata.summary, metadata.handoff_summary]
    .find(isNonEmptyString)

  if (!source_agent || !target_agent || !reason || !summary) {
    return null
  }

  const context = [candidate.context, metadata.context, metadata.handoff_context]
    .find(isNonEmptyString)
  const desired_outcome = [candidate.desired_outcome, metadata.desired_outcome, metadata.handoff_desired_outcome]
    .find(isNonEmptyString)
  const next_step = [candidate.next_step, metadata.next_step, metadata.handoff_next_step]
    .find(isNonEmptyString)
  const created_at = [candidate.created_at, metadata.created_at, metadata.handoff_created_at]
    .find(isNonEmptyString)

  const constraints = [candidate.constraints, metadata.constraints, metadata.handoff_constraints]
    .find(isStringArray)
  const evidence = [candidate.evidence, metadata.evidence, metadata.handoff_evidence]
    .find(isStringArray)
  const related_task_ids = [candidate.related_task_ids, metadata.related_task_ids, metadata.handoff_related_task_ids]
    .find(isNumberArray)

  return {
    source_agent,
    target_agent,
    reason,
    summary,
    ...(context ? { context } : {}),
    ...(desired_outcome ? { desired_outcome } : {}),
    ...(constraints ? { constraints } : {}),
    ...(evidence ? { evidence } : {}),
    ...(next_step ? { next_step } : {}),
    ...(related_task_ids ? { related_task_ids } : {}),
    ...(created_at ? { created_at } : {}),
  }
}
