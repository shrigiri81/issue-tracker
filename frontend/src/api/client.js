import axios from 'axios'
import { queryClient } from '../queryClient'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 by clearing token, React Query cache, and redirecting to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('jwt_user')
      queryClient.clear()
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
// POST /api/login → returns JWT string
export const apiLogin = (username, password) =>
  api.post('/login', { username, password })

// POST /api/register → returns Users entity
export const apiRegister = async (username, email, password) => {
  const res = await api.post('/register', { username, email, password })
  queryClient.invalidateQueries({ queryKey: ['users'] })
  return res
}

// ─── Projects ─────────────────────────────────────────────────────────────────
// GET /api/projects → List<Projects>
//   Projects: { projId, projTitle, projDesc, createdAt, updatedAt,
//               ownerId: Users, projectMembers: Users[], issues: Issues[] }
export const apiGetProjects = () => api.get('/projects')

// GET /api/projects/{id} → Projects
export const apiGetProject = (id) => api.get(`/projects/${id}`)

// POST /api/projects?projectMembersUserIds=1&projectMembersUserIds=2 → Projects
// memberIds must be a non-empty list of valid user IDs
export const apiCreateProject = async (project, memberIds) => {
  const res = await api.post(`/projects?${memberIds.map((id) => `projectMembersUserIds=${id}`).join('&')}`, project)
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  return res
}

// PUT /api/projects/{id}?projectMembersUserIds=1 → Projects
export const apiUpdateProject = async (id, project, memberIds) => {
  const res = await api.put(`/projects/${id}?${memberIds.map((mid) => `projectMembersUserIds=${mid}`).join('&')}`, project)
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  return res
}

// DELETE /api/projects/{id} → String
export const apiDeleteProject = async (id) => {
  const res = await api.delete(`/projects/${id}`)
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  return res
}

// ─── Issues ───────────────────────────────────────────────────────────────────
// GET /api/issues → List<Issues>
//   Issues: { issueId, issueTitle, issueDesc, status, priority, createdAt, updatedAt,
//             project: Projects, createdBy: Users, assignedTo: Users, comments: Comments[] }
export const apiGetIssues = () => api.get('/issues')

// GET /api/issues/{id} → Issues
export const apiGetIssue = (id) => api.get(`/issues/${id}`)

// POST /api/issues → String  (returns "Issue added successfully" or error string)
// NOTE: backend requires issue.assignedTo to be non-null (service does getAssignedTo().getUserId())
// Always send assignedTo with a userId.
export const apiCreateIssue = async (issue) => {
  const res = await api.post('/issues', issue)
  queryClient.invalidateQueries({ queryKey: ['issues'] })
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  return res
}

// PUT /api/issues/{id} → Issues
// NOTE: same constraint — assignedTo must be non-null
export const apiUpdateIssue = async (id, issue) => {
  const res = await api.put(`/issues/${id}`, issue)
  queryClient.invalidateQueries({ queryKey: ['issues'] })
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  return res
}

// DELETE /api/issues/{id}/ → String
export const apiDeleteIssue = async (id) => {
  const res = await api.delete(`/issues/${id}/`)
  queryClient.invalidateQueries({ queryKey: ['issues'] })
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  return res
}

// ─── Comments ─────────────────────────────────────────────────────────────────
// GET /api/issues/{issueId}/comments → List<Comments> (returns ALL comments, ignores issueId param)
//   Comments: { commentId, commentData, createdAt, modifiedAt,
//               commentAuthor: Users, issue: Issues, repliedTo: Comments }
// We filter by issue.issueId client-side.
export const apiGetComments = async (issueId) => {
  const res = await api.get(`/issues/${issueId}/comments`)
  const all = Array.isArray(res.data) ? res.data : []
  const numericId = parseInt(issueId)
  const hasIssueProperty = all.some((c) => c.issue?.issueId != null)
  return { ...res, data: hasIssueProperty ? all.filter((c) => c.issue?.issueId === numericId) : all }
}

// POST /api/issues/{issueId}/comments → Comments
// Body: CommentRequest { commentContent: string, repliedTo: integer | null }
export const apiAddComment = async (issueId, commentContent, repliedTo = null) => {
  const res = await api.post(`/issues/${issueId}/comments`, { commentContent, repliedTo })
  queryClient.invalidateQueries({ queryKey: ['comments', String(issueId)] })
  queryClient.invalidateQueries({ queryKey: ['issues'] })
  return res
}

// PATCH /api/issues/{issueId}/comments/{commentId} → Comments
// Sends plain text to prevent JSON.stringify from adding quotes to either ends
export const apiUpdateComment = async (issueId, commentId, commentData) => {
  const text = typeof commentData === 'string' ? commentData.trim() : String(commentData || '')
  const res = await api.patch(`/issues/${issueId}/comments/${commentId}`, text, {
    headers: { 'Content-Type': 'text/plain' },
  })
  queryClient.invalidateQueries({ queryKey: ['comments', String(issueId)] })
  return res
}

// DELETE /api/issues/{issueId}/comments/{commentId} → String
export const apiDeleteComment = async (issueId, commentId) => {
  const res = await api.delete(`/issues/${issueId}/comments/${commentId}`)
  queryClient.invalidateQueries({ queryKey: ['comments', String(issueId)] })
  return res
}

// ─── Users ────────────────────────────────────────────────────────────────────
// GET /api/users → List<Users>
//   Users: { userId, username, email, role, enabled }  (password fields write-only)
export const apiGetUsers = () => api.get('/users')

// GET /api/users/{id} → Users
export const apiGetUser = (id) => api.get(`/users/${id}`)

// PUT /api/users/{id} → Users
export const apiUpdateUser = async (id, user) => {
  const res = await api.put(`/users/${id}`, user)
  queryClient.invalidateQueries({ queryKey: ['users'] })
  return res
}

// DELETE /api/users/{id} → String
export const apiDeleteUser = async (id) => {
  const res = await api.delete(`/users/${id}`)
  queryClient.invalidateQueries({ queryKey: ['users'] })
  return res
}

// ─── Search ───────────────────────────────────────────────────────────────────
export const apiSearch = (query) => api.get(`/search?query=${encodeURIComponent(query)}`)

export default api
