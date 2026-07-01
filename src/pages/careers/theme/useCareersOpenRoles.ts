import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { matchesAnySearch } from '@/lib/textSearch'

export function useCareersOpenRoles() {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')

  const { data: jobs = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['careers-positions'],
    queryFn: api.careers.getOpenPositions,
    retry: 2,
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['careers-departments'],
    queryFn: api.careers.getDepartments,
  })

  const filteredJobs = useMemo(() => {
    let list = jobs
    if (department) {
      list = list.filter((j) => j.department === department)
    }
    const q = search.trim()
    if (!q) return list
    return list.filter((j) =>
      matchesAnySearch([j.title, j.department, j.location, j.jobCode], q)
    )
  }, [jobs, search, department])

  return {
    jobs,
    filteredJobs,
    departments,
    search,
    setSearch,
    department,
    setDepartment,
    isLoading,
    isError,
    error,
    refetch,
  }
}
