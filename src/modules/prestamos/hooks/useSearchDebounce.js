import { useEffect, useState } from 'react'

export function useSearchDebounce(initialValue = '', delay = 500) {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(searchTerm), delay)
    return () => clearTimeout(timer)
  }, [delay, searchTerm])

  return { searchTerm, setSearchTerm, debouncedValue }
}
