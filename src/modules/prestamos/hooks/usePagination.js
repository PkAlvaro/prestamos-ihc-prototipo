import { useMemo, useState } from 'react'

export function usePagination({ initialPage = 1, initialPageSize = 50, total = 0 } = {}) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const offset = (page - 1) * pageSize
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const helpers = useMemo(
    () => ({
      slice: items => items.slice(offset, offset + pageSize),
      nextPage: () => setPage(current => Math.min(totalPages, current + 1)),
      previousPage: () => setPage(current => Math.max(1, current - 1)),
    }),
    [offset, pageSize, totalPages]
  )

  return { page, setPage, pageSize, setPageSize, total, totalPages, offset, ...helpers }
}
