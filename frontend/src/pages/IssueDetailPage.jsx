import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import Avatar from '../components/Avatar'
import {
  apiGetIssue,
  apiUpdateIssue,
  apiDeleteIssue,
  apiGetComments,
  apiAddComment,
  apiUpdateComment,
  apiDeleteComment,
  apiGetUsers,
} from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDateShort(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function IssueDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [issue, setIssue] = useState(null)
  const [comments, setComments] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const commentInputRef = useRef(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [issueRes, commentsRes, usersRes] = await Promise.allSettled([
        apiGetIssue(id),
        apiGetComments(id),
        apiGetUsers(),
      ])

      if (issueRes.status === 'fulfilled') {
        const iss = issueRes.value.data
        setIssue(iss)
        setEditForm({
          issueTitle: iss.issueTitle ?? '',
          issueDesc: iss.issueDesc ?? '',
          status: iss.status ?? 'OPEN',
          priority: iss.priority ?? 'MEDIUM',
          assignedToId: iss.assignedTo?.userId ?? '',
        })
      } else {
        const err = issueRes.reason
        if (err.response?.status === 404) { navigate('/'); return }
        setError(err.response?.data || err.message || 'Failed to load issue.')
      }

      if (commentsRes.status === 'fulfilled') {
        setComments(Array.isArray(commentsRes.value.data) ? commentsRes.value.data : [])
      }

      if (usersRes.status === 'fulfilled') {
        setAllUsers(Array.isArray(usersRes.value.data) ? usersRes.value.data : [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleSave = async () => {
    // Backend updateIssue calls issue.getProject().getProjectMembers() and issue.getAssignedTo().getUserId()
    // We must send the full issue object with project and a valid assignedTo.
    const assignedUserId = editForm.assignedToId
      ? parseInt(editForm.assignedToId)
      : allUsers.find((u) => u.username === user?.username)?.userId ?? issue?.assignedTo?.userId ?? null

    if (!assignedUserId) {
      alert('Please select an assignee. The backend requires one.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...issue,
        issueTitle: editForm.issueTitle,
        issueDesc: editForm.issueDesc,
        status: editForm.status,
        priority: editForm.priority,
        assignedTo: { userId: assignedUserId },
      }
      await apiUpdateIssue(id, payload)
      setEditing(false)
      await load()
    } catch (err) {
      alert('Failed to update issue: ' + (err.response?.data || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteIssue = async () => {
    if (!confirm('Delete this issue? This cannot be undone.')) return
    try {
      await apiDeleteIssue(id)
      const projId = issue?.project?.projId
      navigate(projId ? `/projects/${projId}` : '/')
    } catch {
      alert('Failed to delete issue.')
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmittingComment(true)
    try {
      await apiAddComment(id, commentText.trim())
      setCommentText('')
      const res = await apiGetComments(id)
      setComments(Array.isArray(res.data) ? res.data : [])
    } catch {
      alert('Failed to add comment.')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleEditComment = async (commentId) => {
    if (!editingCommentText.trim()) return
    try {
      await apiUpdateComment(id, commentId, editingCommentText.trim())
      setEditingCommentId(null)
      const res = await apiGetComments(id)
      setComments(Array.isArray(res.data) ? res.data : [])
    } catch {
      alert('Failed to update comment.')
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    try {
      await apiDeleteComment(id, commentId)
      setComments((prev) => prev.filter((c) => c.commentId !== commentId))
    } catch {
      alert('Failed to delete comment.')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#4450b7] border-t-transparent animate-spin" />
            <p className="text-[13px] text-[#565e74] font-[Inter,sans-serif]">Loading issue...</p>
          </div>
        </div>
      </Layout>
    )
  }

  const project = issue?.project

  return (
    <Layout>
      <div className="p-6 max-w-[1400px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-[#565e74] mb-4 font-[Inter,sans-serif]">
          <button onClick={() => navigate('/')} className="hover:text-[#0b1c30]">Dashboard</button>
          <span className="text-[#c6c5d5]">/</span>
          {project && (
            <>
              <button onClick={() => navigate(`/projects/${project.projId}`)} className="hover:text-[#0b1c30]">{project.projTitle}</button>
              <span className="text-[#c6c5d5]">/</span>
            </>
          )}
          <span className="text-[#0b1c30] font-medium">#{id}</span>
        </div>

        {error && (
          <div className="mb-4 bg-[#ffdad6] border border-[#ffb4a9] rounded-lg px-4 py-3 text-[13px] text-[#ba1a1a] font-[Inter,sans-serif]">
            {error}
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-5 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Issue header */}
            <div className="bg-white rounded-xl p-5 border border-[#e5eeff] shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#767684] bg-[#eff4ff] px-2 py-0.5 rounded border border-[#e5eeff]">#{id}</span>
                  <StatusBadge status={issue?.status} />
                  <PriorityBadge priority={issue?.priority} />
                </div>
                <div className="flex items-center gap-1.5">
                  {!editing ? (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="h-7 px-2.5 flex items-center gap-1 text-[11px] text-[#565e74] hover:text-[#0b1c30] bg-[#eff4ff] hover:bg-[#e5eeff] rounded-lg border border-[#e5eeff] transition-colors font-[Geist,sans-serif]"
                      >
                        <span className="material-symbols-outlined text-[13px]">edit</span>
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteIssue}
                        className="h-7 px-2.5 flex items-center gap-1 text-[11px] text-[#dc2626] bg-[#fef2f2] hover:bg-[#fee2e2] rounded-lg border border-[#fecaca] transition-colors font-[Geist,sans-serif]"
                      >
                        <span className="material-symbols-outlined text-[13px]">delete</span>
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditing(false)}
                        className="h-7 px-2.5 text-[11px] text-[#565e74] bg-[#eff4ff] hover:bg-[#e5eeff] rounded-lg border border-[#e5eeff] transition-colors font-[Geist,sans-serif]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-7 px-2.5 text-[11px] text-white bg-[#4450b7] hover:bg-[#3540a0] disabled:opacity-60 rounded-lg transition-colors font-[Geist,sans-serif]"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editing ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={editForm.issueTitle}
                    onChange={(e) => setEditForm((f) => ({ ...f, issueTitle: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[15px] font-semibold text-[#0b1c30] outline-none focus:border-[#4450b7] transition-all font-[Geist,sans-serif]"
                  />
                  <textarea
                    rows={4}
                    value={editForm.issueDesc}
                    onChange={(e) => setEditForm((f) => ({ ...f, issueDesc: e.target.value }))}
                    placeholder="Issue description..."
                    className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] transition-all resize-none font-[Inter,sans-serif]"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider block mb-1 font-[Geist,sans-serif]">Status</label>
                      <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="w-full h-8 px-2 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[12px] outline-none focus:border-[#4450b7] transition-all font-[Inter,sans-serif]">
                        {['OPEN', 'IN_PROGRESS', 'BLOCKED', 'RESOLVED', 'CLOSED'].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider block mb-1 font-[Geist,sans-serif]">Priority</label>
                      <select value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))} className="w-full h-8 px-2 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[12px] outline-none focus:border-[#4450b7] transition-all font-[Inter,sans-serif]">
                        {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider block mb-1 font-[Geist,sans-serif]">Assignee</label>
                      <select value={editForm.assignedToId} onChange={(e) => setEditForm((f) => ({ ...f, assignedToId: e.target.value }))} className="w-full h-8 px-2 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[12px] outline-none focus:border-[#4450b7] transition-all font-[Inter,sans-serif]">
                        <option value="">— Auto-assign to me —</option>
                        {allUsers.map((u) => <option key={u.userId} value={u.userId}>{u.username}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-[22px] font-semibold text-[#0b1c30] tracking-tight font-[Geist,sans-serif] mb-2">{issue?.issueTitle}</h1>
                  {issue?.issueDesc ? (
                    <p className="text-[14px] text-[#454652] leading-relaxed font-[Inter,sans-serif] whitespace-pre-wrap">{issue.issueDesc}</p>
                  ) : (
                    <p className="text-[13px] text-[#767684] italic font-[Inter,sans-serif]">No description provided.</p>
                  )}
                </>
              )}
            </div>

            {/* Discussion / Comments */}
            <div className="bg-white rounded-xl p-5 border border-[#e5eeff] shadow-sm">
              <h2 className="text-[14px] font-semibold text-[#0b1c30] mb-4 flex items-center gap-2 font-[Geist,sans-serif]">
                <span className="material-symbols-outlined text-[18px] text-[#565e74]">chat</span>
                Discussion
                <span className="px-1.5 py-0.5 rounded-full bg-[#e5eeff] text-[#565e74] text-[11px] font-mono">{comments.length}</span>
              </h2>

              <div className="flex flex-col gap-4 mb-5">
                {comments.length === 0 && (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-[36px] text-[#c6c5d5] block mb-2">chat_bubble_outline</span>
                    <p className="text-[13px] text-[#767684] font-[Inter,sans-serif]">No comments yet. Start the discussion!</p>
                  </div>
                )}
                {comments.map((comment) => (
                  <div key={comment.commentId} className="flex gap-3">
                    <Avatar name={comment.commentAuthor?.username} size="md" className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-[#0b1c30] font-[Geist,sans-serif]">{comment.commentAuthor?.username ?? 'Unknown'}</span>
                        <span className="text-[11px] text-[#767684] font-[Inter,sans-serif]">{formatDate(comment.createdAt)}</span>
                        {comment.modifiedAt !== comment.createdAt && (
                          <span className="text-[10px] text-[#767684] italic font-[Inter,sans-serif]">(edited)</span>
                        )}
                      </div>

                      {editingCommentId === comment.commentId ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            rows={3}
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] transition-all resize-none font-[Inter,sans-serif]"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingCommentId(null)} className="h-7 px-3 text-[11px] text-[#565e74] bg-[#eff4ff] rounded-lg border border-[#e5eeff] hover:bg-[#e5eeff] transition-colors font-[Geist,sans-serif]">Cancel</button>
                            <button onClick={() => handleEditComment(comment.commentId)} className="h-7 px-3 text-[11px] text-white bg-[#4450b7] hover:bg-[#3540a0] rounded-lg transition-colors font-[Geist,sans-serif]">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative">
                          <div className="bg-[#f8f9ff] rounded-lg px-3 py-2.5 border border-[#e5eeff] text-[13px] text-[#454652] leading-relaxed font-[Inter,sans-serif] whitespace-pre-wrap">
                            {comment.commentData}
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={() => { setEditingCommentId(comment.commentId); setEditingCommentText(comment.commentData) }}
                              className="p-1 bg-white rounded shadow-sm border border-[#e5eeff] text-[#565e74] hover:text-[#4450b7] transition-colors"
                            >
                              <span className="material-symbols-outlined text-[12px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.commentId)}
                              className="p-1 bg-white rounded shadow-sm border border-[#e5eeff] text-[#565e74] hover:text-[#ba1a1a] transition-colors"
                            >
                              <span className="material-symbols-outlined text-[12px]">delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment input */}
              <form onSubmit={handleAddComment} className="flex gap-3 items-start border-t border-[#e5eeff] pt-4">
                <Avatar name={user?.username} size="md" className="shrink-0 mt-0.5" />
                <div className="flex-1 flex flex-col gap-2">
                  <textarea
                    ref={commentInputRef}
                    rows={3}
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment(e) }}
                    className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] placeholder:text-[#767684] outline-none focus:border-[#4450b7] focus:ring-2 focus:ring-[#4450b7]/20 transition-all resize-none font-[Inter,sans-serif]"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#767684] font-[Inter,sans-serif]">
                      <kbd className="font-mono bg-[#eff4ff] px-1.5 py-0.5 rounded text-[10px] border border-[#e5eeff]">Ctrl+Enter</kbd> to submit
                    </span>
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="h-8 px-4 bg-[#4450b7] hover:bg-[#3540a0] disabled:opacity-50 text-white text-[12px] font-semibold rounded-lg transition-all font-[Geist,sans-serif]"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right inspector */}
          <aside className="w-full xl:w-[280px] shrink-0 flex flex-col gap-4">
            <div className="bg-white rounded-xl p-4 border border-[#e5eeff] shadow-sm">
              <h3 className="text-[13px] font-semibold text-[#0b1c30] mb-3 pb-2 border-b border-[#e5eeff] font-[Geist,sans-serif]">Issue Properties</h3>
              <div className="flex flex-col divide-y divide-[#f1f5ff]">
                {[
                  { label: 'STATUS', value: <StatusBadge status={issue?.status} /> },
                  { label: 'PRIORITY', value: <PriorityBadge priority={issue?.priority} /> },
                  {
                    label: 'ASSIGNEE',
                    value: issue?.assignedTo ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={issue.assignedTo.username} size="xs" />
                        <span className="text-[12px] text-[#0b1c30] font-[Inter,sans-serif]">{issue.assignedTo.username}</span>
                      </div>
                    ) : <span className="text-[12px] text-[#767684] italic font-[Inter,sans-serif]">Unassigned</span>,
                  },
                  {
                    label: 'CREATED BY',
                    value: issue?.createdBy ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={issue.createdBy.username} size="xs" />
                        <span className="text-[12px] text-[#0b1c30] font-[Inter,sans-serif]">{issue.createdBy.username}</span>
                      </div>
                    ) : <span className="text-[12px] text-[#767684] italic font-[Inter,sans-serif]">—</span>,
                  },
                  { label: 'PROJECT', value: <button onClick={() => project && navigate(`/projects/${project.projId}`)} className="text-[12px] text-[#4450b7] hover:underline font-[Inter,sans-serif]">{project?.projTitle ?? '—'}</button> },
                  { label: 'CREATED', value: <span className="text-[12px] text-[#0b1c30] font-[Inter,sans-serif]">{formatDateShort(issue?.createdAt)}</span> },
                  { label: 'UPDATED', value: <span className="text-[12px] text-[#0b1c30] font-[Inter,sans-serif]">{formatDateShort(issue?.updatedAt)}</span> },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between py-2 gap-2">
                    <span className="text-[11px] font-semibold text-[#767684] uppercase tracking-wider shrink-0 font-[Geist,sans-serif]">{label}</span>
                    <div className="text-right">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  )
}
