import type { PaginationMeta } from '../../shared/types/pagination'
import { DEFAULT_PAGE_SIZE } from '../../shared/types/pagination'

export function parsePagination(
  query: Record<string, unknown>,
  defaultLimit = DEFAULT_PAGE_SIZE
) {
  const all = query.all === 'true' || query.all === true
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), 50)

  return {
    all,
    page,
    limit,
    skip: (page - 1) * limit
  }
}

export function buildPagination(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1)
  }
}
