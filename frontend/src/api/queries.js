import { useQuery } from '@tanstack/react-query'
import {
  apiGetUsers,
  apiGetProjects,
  apiGetProject,
  apiGetIssues,
  apiGetIssue,
  apiGetComments,
} from './client'

/**
 * Hook to fetch all users with 10-minute stale time.
 * Accepts options like { enabled: boolean } for on-demand fetching.
 */
export function useUsers(options = {}) {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiGetUsers()
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes fresh
    gcTime: 30 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch all projects with 5-minute stale time.
 */
export function useProjects(options = {}) {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiGetProjects()
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch a single project by ID.
 */
export function useProject(id, options = {}) {
  return useQuery({
    queryKey: ['projects', String(id)],
    queryFn: async () => {
      const res = await apiGetProject(id)
      return res.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch all issues with 2-minute stale time.
 */
export function useIssues(options = {}) {
  return useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const res = await apiGetIssues()
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 2 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch a single issue by ID.
 */
export function useIssue(id, options = {}) {
  return useQuery({
    queryKey: ['issues', String(id)],
    queryFn: async () => {
      const res = await apiGetIssue(id)
      return res.data
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch comments for an issue.
 */
export function useComments(issueId, options = {}) {
  return useQuery({
    queryKey: ['comments', String(issueId)],
    queryFn: async () => {
      const res = await apiGetComments(issueId)
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: !!issueId,
    staleTime: 1 * 60 * 1000,
    ...options,
  })
}
