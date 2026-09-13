import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import Avatar from '../components/Avatar'
import { apiGetProjects, apiCreateProject, apiDeleteProject, apiGetUsers, apiGetIssues } from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [allIssues, setAllIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('')
  const [newProject, setNewProject] = useState({ projTitle: '', projDesc: '' })
  const [selectedMembers, setSelectedMembers] = useState([])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [projRes, usersRes, issuesRes] = await Promise.allSettled([
        apiGetProjects(),
        apiGetUsers(),
        apiGetIssues(),
      ])
      if (projRes.status === 'fulfilled') {
        setProjects(Array.isArray(projRes.value.data) ? projRes.value.data : [])
      } else {
        setError(projRes.reason?.response?.data || projRes.reason?.message || 'Failed to load projects.')
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(Array.isArray(usersRes.value.data) ? usersRes.value.data : [])
      }
      if (issuesRes.status === 'fulfilled') {
        setAllIssues(Array.isArray(issuesRes.value.data) ? issuesRes.value.data : [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProject.projTitle.trim()) return
    setCreating(true)
    try {
      // Backend requires at least one member in projectMembersUserIds.
      // If none selected, default to the current logged-in user's id by finding them in the users list.
      let memberIds = [...selectedMembers]
      if (memberIds.length === 0) {
        const me = users.find((u) => u.username === user?.username)
        if (me) memberIds = [me.userId]
      }
      // If still empty (e.g. users not loaded), send at least the first user we know about
      if (memberIds.length === 0 && users.length > 0) {
        memberIds = [users[0].userId]
      }
      await apiCreateProject(
        { projTitle: newProject.projTitle, projDesc: newProject.projDesc },
        memberIds
      )
      setShowCreate(false)
      setNewProject({ projTitle: '', projDesc: '' })
      setSelectedMembers([])
      await load()
    } catch (err) {
      alert('Failed to create project: ' + (err.response?.data || err.message))
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this project? This cannot be undone.')) return
    try {
      await apiDeleteProject(id)
      setProjects((prev) => prev.filter((p) => p.projId !== id))
    } catch {
      alert('Failed to delete project.')
    }
  }

  const filtered = projects.filter((p) =>
    !filter || p.projTitle?.toLowerCase().includes(filter.toLowerCase())
  )

  const projectIssuesCount = projects.reduce((sum, p) => sum + (p.issues?.length ?? 0), 0)
  const totalIssues = projectIssuesCount > 0 ? projectIssuesCount : allIssues.length
  const openIssues = projectIssuesCount > 0
    ? projects.reduce(
        (sum, p) => sum + (p.issues?.filter((i) => i.status?.toUpperCase() === 'OPEN').length ?? 0),
        0
      )
    : allIssues.filter((i) => i.status?.toUpperCase() === 'OPEN').length

  return (
    <Layout onNewIssue={() => setShowCreate(true)}>
      <div className="p-6 max-w-[1600px] mx-auto">

        {error && (
          <div className="mb-6 bg-[#eff4ff] border border-[#dce9ff] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px] text-[#4450b7]">lock</span>
              <p className="text-[13px] font-semibold text-[#0b1c30] font-[Geist,sans-serif]">{error}</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="shrink-0 px-4 py-2 bg-[#4450b7] hover:bg-[#3540a0] text-white text-[12px] font-semibold rounded-lg transition-colors font-[Geist,sans-serif] shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              Sign in
            </button>
          </div>
        )}

        {/* KPI strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Projects', value: projects.length, sub: 'Workspaces', icon: 'folder_special', color: 'text-[#4450b7]' },
            { label: 'Open Issues', value: openIssues, sub: 'Tickets', icon: 'pending_actions', color: 'text-[#5e6ad2]' },
            { label: 'Total Issues', value: totalIssues, sub: 'All time', icon: 'check_circle', color: 'text-[#4450b7]' },
            { label: 'Team Members', value: users.length, sub: 'Users', icon: 'group', color: 'text-[#565e74]' },
          ].map(({ label, value, sub, icon, color }) => (
            <div key={label} className="bg-white p-4 rounded-xl border border-[#e5eeff] hover:shadow-md transition-shadow flex flex-col justify-between" style={{ boxShadow: '0 1px 4px rgba(11,28,48,0.04)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#565e74] uppercase tracking-wider font-[Geist,sans-serif]">{label}</span>
                <span className={`p-1.5 rounded-lg bg-[#eff4ff] material-symbols-outlined text-[18px] ${color}`}>{icon}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-[28px] font-semibold text-[#0b1c30] leading-none font-[Geist,sans-serif]">{loading ? '—' : value}</span>
                <span className="text-[13px] text-[#565e74] font-[Inter,sans-serif]">{sub}</span>
              </div>
              <div className="mt-3 w-full bg-[#eff4ff] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#4450b7] h-full rounded-full" style={{ width: loading ? '0%' : '100%', transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </section>

        {/* Header + controls */}
        <section className="flex flex-col gap-3 mb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4450b7]" />
                <h1 className="text-[20px] font-semibold text-[#0b1c30] tracking-tight font-[Geist,sans-serif]">Projects Overview</h1>
                <span className="px-2 py-0.5 rounded-full bg-[#dce9ff] text-[#4450b7] text-[11px] font-semibold font-mono">{projects.length} Active</span>
              </div>
              <p className="text-[13px] text-[#565e74] mt-0.5 font-[Inter,sans-serif]">All your workspaces in one place.</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="h-8 px-4 bg-[#4450b7] hover:bg-[#3540a0] text-white text-[12px] font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.99] font-[Geist,sans-serif] self-start md:self-auto"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Project
            </button>
          </div>

          <div className="flex items-center gap-3 bg-[#eff4ff]/60 border border-[#c6c5d5]/60 rounded-xl p-3">
            <div className="relative flex-1 max-w-xs">
              <span className="material-symbols-outlined text-[#767684] text-[16px] absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
              <input
                type="text"
                placeholder="Filter projects..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-white text-[#0b1c30] text-[12px] placeholder:text-[#767684] border border-[#c6c5d5]/60 outline-none focus:border-[#4450b7] transition-colors font-[Inter,sans-serif]"
              />
            </div>
            <span className="text-[11px] text-[#565e74] font-[Geist,sans-serif]">
              <strong className="text-[#0b1c30]">{filtered.length}</strong> of {projects.length} projects
            </span>
          </div>
        </section>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-[#e5eeff] p-4 h-52 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e5eeff]" />
                  <div className="flex-1">
                    <div className="h-3 bg-[#e5eeff] rounded w-2/3 mb-2" />
                    <div className="h-2 bg-[#e5eeff] rounded w-1/3" />
                  </div>
                </div>
                <div className="h-2 bg-[#e5eeff] rounded w-full mb-2" />
                <div className="h-2 bg-[#e5eeff] rounded w-4/5" />
              </div>
            ))}
          </div>
        )}

        {/* Projects grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((project) => {
              const issues = (project.issues && project.issues.length > 0)
                ? project.issues
                : allIssues.filter((i) => i.project?.projId === project.projId)
              const issueCount = issues.length
              const openCount = issues.filter((i) => i.status?.toUpperCase() === 'OPEN').length
              const members = project.projectMembers ?? []
              const ownerName = project.ownerId?.username ?? '—'
              const progress = issueCount > 0 ? Math.round(((issueCount - openCount) / issueCount) * 100) : 0

              return (
                <div
                  key={project.projId}
                  onClick={() => navigate(`/projects/${project.projId}`)}
                  className="bg-white rounded-xl p-4 border border-[#e5eeff] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  style={{ boxShadow: '0 1px 4px rgba(11,28,48,0.04)' }}
                >
                  <div className="flex flex-col gap-2.5">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#dce9ff] text-[#4450b7] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[18px]">folder</span>
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-[14px] font-semibold text-[#0b1c30] truncate font-[Geist,sans-serif]">{project.projTitle}</h2>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#565e74] mt-0.5 font-[Inter,sans-serif]">
                              <Avatar name={ownerName} size="xs" />
                              <span>{ownerName}</span>
                              <span>·</span>
                              <span>{formatDate(project.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteProject(project.projId, e)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded text-[#767684] hover:text-[#ba1a1a] hover:bg-[#ffdad6] flex items-center justify-center transition-all"
                          title="Delete project"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                      {project.projDesc && (
                        <p className="text-[12px] text-[#565e74] mt-2 line-clamp-2 leading-relaxed font-[Inter,sans-serif]">{project.projDesc}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-[#eff4ff]/60 border border-[#e5eeff]">
                      <div className="flex items-center gap-2 text-[#565e74] font-[Inter,sans-serif]">
                        <span><strong className="text-[#0b1c30] font-semibold">{openCount}</strong> open</span>
                        <span>·</span>
                        <span><strong className="text-[#0b1c30] font-semibold">{issueCount - openCount}</strong> closed</span>
                      </div>
                      <span className="font-mono text-[#0b1c30] font-semibold">{progress}%</span>
                    </div>

                    <div className="w-full bg-[#dce9ff] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#4450b7] h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#e5eeff] flex items-center justify-between">
                    <div className="flex items-center -space-x-1.5">
                      {members.slice(0, 3).map((m, i) => (
                        <Avatar key={m.userId ?? i} name={m.username} size="sm" className="ring-2 ring-white" />
                      ))}
                      {members.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-[#dce9ff] text-[#4450b7] flex items-center justify-center text-[9px] font-bold ring-2 ring-white">
                          +{members.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-[12px] text-[#4450b7] font-semibold hover:underline flex items-center gap-0.5 font-[Geist,sans-serif]">
                      Open Board
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Create new card */}
            <div
              onClick={() => setShowCreate(true)}
              className="border-2 border-dashed border-[#c6c5d5]/60 hover:border-[#4450b7]/60 bg-white/50 hover:bg-[#eff4ff]/40 rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center cursor-pointer group min-h-[200px]"
            >
              <div className="w-9 h-9 rounded-full bg-[#dce9ff] group-hover:bg-[#4450b7] text-[#4450b7] group-hover:text-white flex items-center justify-center transition-all mb-2 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">add</span>
              </div>
              <h3 className="text-[14px] font-semibold text-[#0b1c30] font-[Geist,sans-serif]">New Project</h3>
              <p className="text-[11px] text-[#565e74] max-w-[180px] mt-1 font-[Inter,sans-serif]">Create a new workspace for your team.</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && !error && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-[48px] text-[#c6c5d5]">folder_open</span>
            <p className="mt-3 text-[15px] font-semibold text-[#0b1c30] font-[Geist,sans-serif]">No projects yet</p>
            <p className="text-[13px] text-[#565e74] mt-1 font-[Inter,sans-serif]">Create your first project to get started.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 h-9 px-5 bg-[#4450b7] text-white text-[13px] font-semibold rounded-lg hover:bg-[#3540a0] transition-colors font-[Geist,sans-serif]"
            >
              Create Project
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <form onSubmit={handleCreateProject} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider font-[Geist,sans-serif]">Project Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Website Redesign"
              value={newProject.projTitle}
              onChange={(e) => setNewProject((p) => ({ ...p, projTitle: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] focus:ring-2 focus:ring-[#4450b7]/20 transition-all font-[Inter,sans-serif]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider font-[Geist,sans-serif]">Description</label>
            <textarea
              placeholder="Describe the project goals..."
              rows={3}
              value={newProject.projDesc}
              onChange={(e) => setNewProject((p) => ({ ...p, projDesc: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] focus:ring-2 focus:ring-[#4450b7]/20 transition-all resize-none font-[Inter,sans-serif]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider font-[Geist,sans-serif]">Members</label>
            <div className="max-h-40 overflow-y-auto border border-[#c6c5d5] rounded-lg bg-[#f8f9ff] divide-y divide-[#e5eeff]">
              {users.map((u) => (
                <label key={u.userId} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[#eff4ff] transition-colors">
                  <input
                    type="checkbox"
                    value={u.userId}
                    checked={selectedMembers.includes(u.userId)}
                    onChange={(e) =>
                      setSelectedMembers((prev) =>
                        e.target.checked ? [...prev, u.userId] : prev.filter((id) => id !== u.userId)
                      )
                    }
                    className="rounded accent-[#4450b7]"
                  />
                  <Avatar name={u.username} size="sm" />
                  <span className="text-[13px] text-[#0b1c30] font-[Inter,sans-serif]">{u.username}</span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-[#767684] font-[Inter,sans-serif]">If none selected, you will be added as the sole member.</p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="flex-1 h-9 border border-[#c6c5d5] text-[#0b1c30] text-[13px] font-medium rounded-lg hover:bg-[#f8f9ff] transition-colors font-[Geist,sans-serif]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 h-9 bg-[#4450b7] hover:bg-[#3540a0] disabled:opacity-60 text-white text-[13px] font-semibold rounded-lg transition-all font-[Geist,sans-serif]"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
