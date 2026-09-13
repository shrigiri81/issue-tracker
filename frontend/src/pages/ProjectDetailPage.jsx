import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import Avatar from '../components/Avatar'
import {
  apiGetProject,
  apiGetIssues,
  apiCreateIssue,
  apiDeleteIssue,
  apiUpdateProject,
  apiDeleteProject,
  apiGetUsers,
} from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [project, setProject] = useState(null)
  const [issues, setIssues] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterQuery, setFilterQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterPriority, setFilterPriority] = useState('ALL')

  const [showNewIssue, setShowNewIssue] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [creatingIssue, setCreatingIssue] = useState(false)
  const [updatingProject, setUpdatingProject] = useState(false)

  const [newIssue, setNewIssue] = useState({ issueTitle: '', issueDesc: '', status: 'OPEN', priority: 'MEDIUM', assignedToId: '' })
  const [editProject, setEditProject] = useState({ projTitle: '', projDesc: '', memberIds: [] })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [projRes, issuesRes, usersRes] = await Promise.allSettled([
        apiGetProject(id),
        apiGetIssues(),
        apiGetUsers(),
      ])

      if (projRes.status === 'fulfilled') {
        const proj = projRes.value.data
        setProject(proj)
        const memberIds = (proj.projectMembers ?? []).map((m) => m.userId)
        setEditProject({ projTitle: proj.projTitle ?? '', projDesc: proj.projDesc ?? '', memberIds })
      } else {
        const err = projRes.reason
        if (err.response?.status === 404) { navigate('/'); return }
        setError(err.response?.data || err.message || 'Failed to load project.')
      }

      let projectIssues = []
      if (projRes.status === 'fulfilled' && Array.isArray(projRes.value.data?.issues) && projRes.value.data.issues.length > 0) {
        projectIssues = projRes.value.data.issues
      } else if (issuesRes.status === 'fulfilled') {
        const allIssues = Array.isArray(issuesRes.value.data) ? issuesRes.value.data : []
        const matching = allIssues.filter((i) => i.project?.projId === parseInt(id))
        projectIssues = matching
      }
      setIssues(projectIssues)

      if (usersRes.status === 'fulfilled') {
        setAllUsers(Array.isArray(usersRes.value.data) ? usersRes.value.data : [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleCreateIssue = async (e) => {
    e.preventDefault()
    if (!newIssue.issueTitle.trim()) return

    // Backend requires assignedTo to be a member of the project team
    const members = (project?.projectMembers && project.projectMembers.length > 0)
      ? project.projectMembers
      : allUsers

    const assignedUserId = newIssue.assignedToId
      ? parseInt(newIssue.assignedToId)
      : members.find((u) => u.username === user?.username)?.userId ?? (members[0]?.userId ?? null)

    if (!assignedUserId) {
      alert('Please select an assignee. The backend requires an assignee from the project team.')
      return
    }

    setCreatingIssue(true)
    try {
      const payload = {
        issueTitle: newIssue.issueTitle,
        issueDesc: newIssue.issueDesc,
        status: newIssue.status,
        priority: newIssue.priority,
        project: {
          projId: parseInt(id),
          projTitle: project?.projTitle,
          projectMembers: members.map((m) => ({ userId: m.userId, username: m.username })),
        },
        assignedTo: { userId: assignedUserId },
      }
      const res = await apiCreateIssue(payload)
      if (typeof res.data === 'string' && (res.data.includes('not a part') || res.data.startsWith('Failed'))) {
        alert(res.data)
        return
      }
      setShowNewIssue(false)
      setNewIssue({ issueTitle: '', issueDesc: '', status: 'OPEN', priority: 'MEDIUM', assignedToId: '' })
      await load()
    } catch (err) {
      alert('Failed to create issue: ' + (err.response?.data || err.message))
    } finally {
      setCreatingIssue(false)
    }
  }

  const handleUpdateProject = async (e) => {
    e.preventDefault()
    setUpdatingProject(true)
    try {
      // Backend requires non-empty projectMembersUserIds list
      let memberIds = [...editProject.memberIds]
      if (memberIds.length === 0) {
        const me = allUsers.find((u) => u.username === user?.username)
        if (me) memberIds = [me.userId]
      }
      await apiUpdateProject(id, { projTitle: editProject.projTitle, projDesc: editProject.projDesc }, memberIds)
      setShowEditProject(false)
      await load()
    } catch (err) {
      alert('Failed to update project: ' + (err.response?.data || err.message))
    } finally {
      setUpdatingProject(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project? All issues will be removed. This cannot be undone.')) return
    try {
      await apiDeleteProject(id)
      navigate('/')
    } catch {
      alert('Failed to delete project.')
    }
  }

  const handleDeleteIssue = async (issueId, e) => {
    e.stopPropagation()
    if (!confirm('Delete this issue?')) return
    try {
      await apiDeleteIssue(issueId)
      setIssues((prev) => prev.filter((i) => i.issueId !== issueId))
    } catch {
      alert('Failed to delete issue.')
    }
  }

  const filtered = issues.filter((i) => {
    const matchQuery = !filterQuery || i.issueTitle?.toLowerCase().includes(filterQuery.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || i.status?.toUpperCase() === filterStatus
    const matchPriority = filterPriority === 'ALL' || i.priority?.toUpperCase() === filterPriority
    return matchQuery && matchStatus && matchPriority
  })

  const openCount = issues.filter((i) => i.status?.toUpperCase() === 'OPEN').length
  const closedCount = issues.filter((i) => ['CLOSED', 'RESOLVED'].includes(i.status?.toUpperCase())).length
  const progress = issues.length > 0 ? Math.round((closedCount / issues.length) * 100) : 0
  const members = project?.projectMembers ?? []

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#4450b7] border-t-transparent animate-spin" />
            <p className="text-[13px] text-[#565e74] font-[Inter,sans-serif]">Loading project...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout onNewIssue={() => setShowNewIssue(true)}>
      <div className="p-6 max-w-[1600px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-[#565e74] mb-4 font-[Inter,sans-serif]">
          <button onClick={() => navigate('/')} className="hover:text-[#0b1c30] flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">grid_view</span>
            Dashboard
          </button>
          <span className="text-[#c6c5d5]">/</span>
          <span className="text-[#0b1c30] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4450b7]" />
            {project?.projTitle ?? 'Project'}
          </span>
        </div>

        {error && (
          <div className="mb-4 bg-[#ffdad6] border border-[#ffb4a9] rounded-lg px-4 py-3 text-[13px] text-[#ba1a1a] font-[Inter,sans-serif]">
            {error}
          </div>
        )}

        {/* Project header card */}
        <div className="bg-white rounded-xl p-5 border border-[#e5eeff] mb-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-[24px] font-semibold text-[#0b1c30] tracking-tight font-[Geist,sans-serif]">{project?.projTitle}</h1>
              {project?.projDesc && (
                <p className="text-[13px] text-[#565e74] mt-1.5 font-[Inter,sans-serif]">{project.projDesc}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#eff4ff] border border-[#e5eeff]">
                  <Avatar name={project?.ownerId?.username} size="xs" />
                  <span className="text-[#565e74]">Owner:</span>
                  <span className="font-medium text-[#0b1c30]">{project?.ownerId?.username ?? '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#eff4ff] border border-[#e5eeff]">
                  <div className="flex -space-x-1.5">
                    {members.slice(0, 3).map((m, i) => <Avatar key={m.userId ?? i} name={m.username} size="xs" className="ring-1 ring-white" />)}
                  </div>
                  <span className="font-medium text-[#0b1c30]">{members.length} Members</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#eff4ff] border border-[#e5eeff]">
                  <span className="material-symbols-outlined text-[14px] text-[#767684]">calendar_today</span>
                  <span className="text-[#565e74]">Updated: <strong className="text-[#0b1c30]">{formatDate(project?.updatedAt)}</strong></span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-64 bg-[#eff4ff]/40 border border-[#e5eeff] rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#565e74] uppercase tracking-wider font-[Geist,sans-serif]">Progress</span>
                <span className="text-[12px] font-semibold text-[#4450b7] font-[Geist,sans-serif]">{progress}% Done</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#dce9ff] overflow-hidden">
                <div className="bg-[#4450b7] h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#565e74] font-[Inter,sans-serif]">
                <span>{issues.length} issues total</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#4450b7]" />{closedCount} closed</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{openCount} open</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#e5eeff]">
            <button
              onClick={() => setShowNewIssue(true)}
              className="h-8 px-3 bg-[#5e6ad2] hover:bg-[#4450b7] text-white text-[12px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors font-[Geist,sans-serif]"
            >
              <span className="material-symbols-outlined text-[15px]">add_circle</span>
              New Issue
            </button>
            <button
              onClick={() => setShowEditProject(true)}
              className="h-8 px-3 bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] text-[12px] font-medium rounded-lg flex items-center gap-1.5 border border-[#c6c5d5]/60 transition-colors font-[Geist,sans-serif]"
            >
              <span className="material-symbols-outlined text-[14px] text-[#565e74]">edit</span>
              Edit Project
            </button>
            <button
              onClick={handleDeleteProject}
              className="h-8 px-3 bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc2626] text-[12px] font-medium rounded-lg flex items-center gap-1.5 border border-[#fecaca] transition-colors font-[Geist,sans-serif] ml-auto"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              Delete Project
            </button>
          </div>
        </div>

        {/* Issues table + right inspector */}
        <div className="flex flex-col xl:flex-row gap-4 items-start">
          <div className="flex-1 min-w-0 bg-white rounded-xl border border-[#e5eeff] overflow-hidden shadow-sm">
            {/* Table toolbar */}
            <div className="px-4 py-2.5 border-b border-[#e5eeff] bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[#0b1c30] font-[Geist,sans-serif]">Issues</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#e5eeff] text-[#565e74] text-[11px] font-mono">{filtered.length}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-7 px-2 rounded bg-[#eff4ff] border border-[#e5eeff] text-[11px] text-[#0b1c30] outline-none cursor-pointer font-[Geist,sans-serif]"
                >
                  {['ALL', 'OPEN', 'IN_PROGRESS', 'BLOCKED', 'RESOLVED', 'CLOSED'].map((s) => (
                    <option key={s} value={s}>{s === 'ALL' ? 'Status: All' : s.replace('_', ' ')}</option>
                  ))}
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="h-7 px-2 rounded bg-[#eff4ff] border border-[#e5eeff] text-[11px] text-[#0b1c30] outline-none cursor-pointer font-[Geist,sans-serif]"
                >
                  {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                    <option key={p} value={p}>{p === 'ALL' ? 'Priority: All' : p}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1 bg-[#eff4ff] px-2 h-7 rounded border border-[#e5eeff]">
                  <span className="material-symbols-outlined text-[14px] text-[#767684]">search</span>
                  <input
                    type="text"
                    placeholder="Filter issues..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-[11px] text-[#0b1c30] placeholder:text-[#767684] w-32 font-[Inter,sans-serif]"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[#0b1c30]">
                <thead className="bg-[#eff4ff] text-[#565e74] text-[11px] uppercase font-semibold select-none font-[Geist,sans-serif]">
                  <tr>
                    <th className="w-16 px-3 py-3"># ID</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="w-32 px-3 py-3">Status</th>
                    <th className="w-28 px-3 py-3">Priority</th>
                    <th className="w-36 px-3 py-3">Assignee</th>
                    <th className="w-28 px-3 py-3">Created</th>
                    <th className="w-20 px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[#767684] font-[Inter,sans-serif]">
                        <span className="material-symbols-outlined text-[36px] block mb-2 text-[#c6c5d5]">inbox</span>
                        No issues found
                      </td>
                    </tr>
                  )}
                  {filtered.map((issue, idx) => (
                    <tr
                      key={issue.issueId}
                      onClick={() => navigate(`/issues/${issue.issueId}`)}
                      className={`hover:bg-[#eff4ff]/50 transition-colors cursor-pointer group border-b border-[#e5eeff]/80 ${idx % 2 === 0 ? '' : 'bg-white'}`}
                    >
                      <td className="w-16 px-3 py-2 font-mono text-[11px] text-[#767684]">#{issue.issueId}</td>
                      <td className="px-4 py-2 min-w-0">
                        <span className="font-medium text-[#0b1c30] text-[13px] hover:text-[#4450b7] transition-colors truncate block max-w-xs">
                          {issue.issueTitle}
                        </span>
                      </td>
                      <td className="w-32 px-3 py-2"><StatusBadge status={issue.status} /></td>
                      <td className="w-28 px-3 py-2"><PriorityBadge priority={issue.priority} /></td>
                      <td className="w-36 px-3 py-2">
                        {issue.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar name={issue.assignedTo.username} size="xs" />
                            <span className="text-[12px] text-[#565e74] truncate max-w-[90px] font-[Inter,sans-serif]">{issue.assignedTo.username}</span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-[#767684] italic font-[Inter,sans-serif]">Unassigned</span>
                        )}
                      </td>
                      <td className="w-28 px-3 py-2 font-mono text-[11px] text-[#767684]">{formatDate(issue.createdAt)}</td>
                      <td className="w-20 px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/issues/${issue.issueId}`) }}
                            className="p-1 hover:bg-[#e5eeff] rounded text-[#767684] hover:text-[#4450b7] transition-colors"
                            title="View"
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteIssue(issue.issueId, e)}
                            className="p-1 hover:bg-[#ffdad6] rounded text-[#767684] hover:text-[#ba1a1a] transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2 bg-white border-t border-[#e5eeff] flex items-center justify-between text-[11px] text-[#565e74] font-[Inter,sans-serif]">
              <span>Showing <strong className="text-[#0b1c30]">{filtered.length}</strong> of {issues.length} issues</span>
              <button
                onClick={() => setShowNewIssue(true)}
                className="flex items-center gap-1 text-[#4450b7] hover:underline font-medium font-[Geist,sans-serif]"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Add issue
              </button>
            </div>
          </div>

          {/* Right inspector */}
          <aside className="w-full xl:w-[300px] shrink-0 flex flex-col gap-4">
            <div className="bg-white rounded-xl p-4 border border-[#e5eeff] shadow-sm">
              <h3 className="text-[13px] font-semibold text-[#0b1c30] mb-3 font-[Geist,sans-serif]">Project Details</h3>
              <div className="flex flex-col gap-2 text-[12px]">
                {[
                  { label: 'OWNER', value: project?.ownerId?.username ?? '—' },
                  { label: 'MEMBERS', value: `${members.length} people` },
                  { label: 'TOTAL ISSUES', value: issues.length },
                  { label: 'OPEN', value: openCount },
                  { label: 'CLOSED', value: closedCount },
                  { label: 'CREATED', value: formatDate(project?.createdAt) },
                  { label: 'UPDATED', value: formatDate(project?.updatedAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#f1f5ff] last:border-0">
                    <span className="text-[11px] font-semibold text-[#767684] uppercase tracking-wider font-[Geist,sans-serif]">{label}</span>
                    <span className="text-[#0b1c30] font-medium font-[Inter,sans-serif]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#e5eeff] shadow-sm">
              <h3 className="text-[13px] font-semibold text-[#0b1c30] mb-3 font-[Geist,sans-serif]">Team</h3>
              <div className="flex flex-col gap-2">
                {members.slice(0, 8).map((m) => (
                  <div key={m.userId} className="flex items-center gap-2">
                    <Avatar name={m.username} size="sm" />
                    <span className="text-[12px] text-[#0b1c30] font-[Inter,sans-serif]">{m.username}</span>
                    {m.userId === project?.ownerId?.userId && (
                      <span className="text-[10px] text-[#4450b7] bg-[#eff4ff] px-1.5 py-0.5 rounded-full font-semibold font-[Geist,sans-serif]">Owner</span>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-[12px] text-[#767684] italic font-[Inter,sans-serif]">No members assigned</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* New Issue Modal */}
      <Modal open={showNewIssue} onClose={() => setShowNewIssue(false)} title="New Issue">
        <form onSubmit={handleCreateIssue} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider font-[Geist,sans-serif]">Title *</label>
            <input
              type="text" required
              placeholder="Issue title..."
              value={newIssue.issueTitle}
              onChange={(e) => setNewIssue((p) => ({ ...p, issueTitle: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] focus:ring-2 focus:ring-[#4450b7]/20 transition-all font-[Inter,sans-serif]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider font-[Geist,sans-serif]">Description</label>
            <textarea
              rows={3}
              placeholder="Describe the issue..."
              value={newIssue.issueDesc}
              onChange={(e) => setNewIssue((p) => ({ ...p, issueDesc: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] focus:ring-2 focus:ring-[#4450b7]/20 transition-all resize-none font-[Inter,sans-serif]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider font-[Geist,sans-serif]">Status</label>
              <select
                value={newIssue.status}
                onChange={(e) => setNewIssue((p) => ({ ...p, status: e.target.value }))}
                className="h-9 px-3 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] transition-all font-[Inter,sans-serif]"
              >
                {['OPEN', 'IN_PROGRESS', 'BLOCKED', 'RESOLVED', 'CLOSED'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider font-[Geist,sans-serif]">Priority</label>
              <select
                value={newIssue.priority}
                onChange={(e) => setNewIssue((p) => ({ ...p, priority: e.target.value }))}
                className="h-9 px-3 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] transition-all font-[Inter,sans-serif]"
              >
                {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider font-[Geist,sans-serif]">
              Assignee <span className="text-[#dc2626]">*</span>
            </label>
            <select
              value={newIssue.assignedToId}
              onChange={(e) => setNewIssue((p) => ({ ...p, assignedToId: e.target.value }))}
              className="h-9 px-3 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] transition-all font-[Inter,sans-serif]"
            >
              <option value="">— Auto-assign (Project Member) —</option>
              {(project?.projectMembers?.length ? project.projectMembers : allUsers).map((u) => (
                <option key={u.userId} value={u.userId}>{u.username}</option>
              ))}
            </select>
            <p className="text-[11px] text-[#767684] font-[Inter,sans-serif]">Backend requires the assignee to be a member of this project team.</p>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowNewIssue(false)} className="flex-1 h-9 border border-[#c6c5d5] text-[#0b1c30] text-[13px] font-medium rounded-lg hover:bg-[#f8f9ff] transition-colors font-[Geist,sans-serif]">Cancel</button>
            <button type="submit" disabled={creatingIssue} className="flex-1 h-9 bg-[#4450b7] hover:bg-[#3540a0] disabled:opacity-60 text-white text-[13px] font-semibold rounded-lg transition-all font-[Geist,sans-serif]">
              {creatingIssue ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal open={showEditProject} onClose={() => setShowEditProject(false)} title="Edit Project">
        <form onSubmit={handleUpdateProject} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider font-[Geist,sans-serif]">Title *</label>
            <input
              type="text" required
              value={editProject.projTitle}
              onChange={(e) => setEditProject((p) => ({ ...p, projTitle: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] focus:ring-2 focus:ring-[#4450b7]/20 transition-all font-[Inter,sans-serif]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider font-[Geist,sans-serif]">Description</label>
            <textarea
              rows={3}
              value={editProject.projDesc}
              onChange={(e) => setEditProject((p) => ({ ...p, projDesc: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] focus:ring-2 focus:ring-[#4450b7]/20 transition-all resize-none font-[Inter,sans-serif]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider font-[Geist,sans-serif]">Members</label>
            <div className="max-h-40 overflow-y-auto border border-[#c6c5d5] rounded-lg bg-[#f8f9ff] divide-y divide-[#e5eeff]">
              {allUsers.map((u) => (
                <label key={u.userId} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[#eff4ff] transition-colors">
                  <input
                    type="checkbox"
                    checked={editProject.memberIds.includes(u.userId)}
                    onChange={(e) => setEditProject((p) => ({
                      ...p,
                      memberIds: e.target.checked
                        ? [...p.memberIds, u.userId]
                        : p.memberIds.filter((id) => id !== u.userId),
                    }))}
                    className="rounded accent-[#4450b7]"
                  />
                  <Avatar name={u.username} size="sm" />
                  <span className="text-[13px] text-[#0b1c30] font-[Inter,sans-serif]">{u.username}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowEditProject(false)} className="flex-1 h-9 border border-[#c6c5d5] text-[#0b1c30] text-[13px] font-medium rounded-lg hover:bg-[#f8f9ff] transition-colors font-[Geist,sans-serif]">Cancel</button>
            <button type="submit" disabled={updatingProject} className="flex-1 h-9 bg-[#4450b7] hover:bg-[#3540a0] disabled:opacity-60 text-white text-[13px] font-semibold rounded-lg transition-all font-[Geist,sans-serif]">
              {updatingProject ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
