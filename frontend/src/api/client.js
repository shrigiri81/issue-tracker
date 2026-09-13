import axios from 'axios'

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

// Handle 401 by clearing token and redirecting to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('jwt_user')
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
export const apiRegister = (username, email, password) =>
  api.post('/register', { username, email, password })

// ─── Projects ─────────────────────────────────────────────────────────────────
// GET /api/projects → List<Projects>
//   Projects: { projId, projTitle, projDesc, createdAt, updatedAt,
//               ownerId: Users, projectMembers: Users[], issues: Issues[] }
export const apiGetProjects = () => api.get('/projects')

// GET /api/projects/{id} → Projects
export const apiGetProject = (id) => api.get(`/projects/${id}`)

// POST /api/projects?projectMembersUserIds=1&projectMembersUserIds=2 → Projects
// memberIds must be a non-empty list of valid user IDs
export const apiCreateProject = (project, memberIds) =>
  api.post(`/projects?${memberIds.map((id) => `projectMembersUserIds=${id}`).join('&')}`, project)

// PUT /api/projects/{id}?projectMembersUserIds=1 → Projects
export const apiUpdateProject = (id, project, memberIds) =>
  api.put(`/projects/${id}?${memberIds.map((mid) => `projectMembersUserIds=${mid}`).join('&')}`, project)

// DELETE /api/projects/{id} → String
export const apiDeleteProject = (id) => api.delete(`/projects/${id}`)

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
export const apiCreateIssue = (issue) => api.post('/issues', issue)

// PUT /api/issues/{id} → Issues
// NOTE: same constraint — assignedTo must be non-null
export const apiUpdateIssue = (id, issue) => api.put(`/issues/${id}`, issue)

// DELETE /api/issues/{id}/ → String
export const apiDeleteIssue = (id) => api.delete(`/issues/${id}/`)

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
export const apiAddComment = (issueId, commentContent, repliedTo = null) =>
  api.post(`/issues/${issueId}/comments`, { commentContent, repliedTo })

// PATCH /api/issues/{issueId}/comments/{commentId} → Comments
// Body: raw JSON string
export const apiUpdateComment = (issueId, commentId, commentData) =>
  api.patch(`/issues/${issueId}/comments/${commentId}`, JSON.stringify(commentData), {
    headers: { 'Content-Type': 'application/json' },
  })

// DELETE /api/issues/{issueId}/comments/{commentId} → String
export const apiDeleteComment = (issueId, commentId) =>
  api.delete(`/issues/${issueId}/comments/${commentId}`)

// ─── Users ────────────────────────────────────────────────────────────────────
// GET /api/users → List<Users>
//   Users: { userId, username, email, role, enabled }  (password fields write-only)
export const apiGetUsers = () => api.get('/users')

// GET /api/users/{id} → Users
export const apiGetUser = (id) => api.get(`/users/${id}`)

// PUT /api/users/{id} → Users
export const apiUpdateUser = (id, user) => api.put(`/users/${id}`, user)

// DELETE /api/users/{id} → String
export const apiDeleteUser = (id) => api.delete(`/users/${id}`)

// ─── Search ───────────────────────────────────────────────────────────────────
export const apiSearch = (query) => api.get(`/search?query=${encodeURIComponent(query)}`)

export default api
