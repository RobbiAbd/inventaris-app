export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResult<T> {
  items: T[]
  pagination: PaginationMeta
}

export const DEFAULT_PAGE_SIZE = 10
