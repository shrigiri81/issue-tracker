import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Shield, AlertTriangle, Info, CheckCircle2, Lock, KeyRound, Trash2 } from 'lucide-react'
import Layout from '../components/Layout'
import Avatar from '../components/Avatar'
import AlertModal from '../components/AlertModal'
import ConfirmModal from '../components/ConfirmModal'
import api, { apiGetUsers, apiDeleteUser } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('account')
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  // Modals for alerts and confirms (Item 3)
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'error' })
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)

  const showAlert = (message, title = 'Notification', type = 'error') => {
    setAlertState({ isOpen: true, title, message, type })
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      setPwError('Please fill in all fields.')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.')
      return
    }

    setPwLoading(true)
    try {
      const usersRes = await apiGetUsers()
      const usersList = Array.isArray(usersRes.data) ? usersRes.data : []
      const currentUser = usersList.find((u) => u.username === user?.username)
      if (!currentUser) {
        setPwError('User account not found.')
        return
      }

      const res = await api.patch(`/users/${currentUser.userId}/password`, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })

      const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
      if (text && !text.includes('Password updated successfully')) {
        setPwError(text)
      } else {
        setPwSuccess('Password updated successfully!')
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (err) {
      setPwError(err.response?.data || err.message || 'Failed to change password. Please verify your current password and try again.')
    } finally {
      setPwLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username) return
    try {
      const usersRes = await apiGetUsers()
      const usersList = Array.isArray(usersRes.data) ? usersRes.data : []
      const currentUser = usersList.find((u) => u.username === user?.username)
      if (currentUser) {
        await apiDeleteUser(currentUser.userId)
      }
      setShowDeleteConfirmModal(false)
      logout()
      navigate('/login')
    } catch (err) {
      showAlert(err.response?.data || err.message || 'Failed to delete account.', 'Account Deletion Error')
    }
  }

  const TABS = [
    { id: 'account', label: 'Account Profile', icon: User },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ]

  const roleBadgeColor =
    user?.role === 'ADMIN'
      ? 'bg-purple-50 text-purple-700 border-purple-200'
      : 'bg-[#eff4ff] text-[#4450b7] border-[#c6d7ff]'

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        {/* Header Profile Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 mb-6 border border-[#e5eeff] shadow-xs">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-1 rounded-full bg-[#eff4ff] ring-2 ring-[#4450b7]/20">
                <Avatar name={user?.username} size="lg" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[20px] font-bold text-[#0b1c30] font-[Geist,sans-serif] tracking-tight">{user?.username || 'User Profile'}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleBadgeColor} font-[Geist,sans-serif]`}>
                    {user?.role || 'Member'}
                  </span>
                </div>
                <p className="text-[13px] text-[#565e74] font-[Inter,sans-serif] mt-0.5">
                  {user?.email || `${user?.username || 'user'}@issuetracker.local`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Session</span>
            </div>
          </div>
        </div>

        {/* Tab navigation (Item 6 & 7) */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#e5eeff] pb-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id
            const isDanger = id === 'danger'
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition-all rounded-lg font-[Geist,sans-serif] ${
                  isActive
                    ? isDanger
                      ? 'bg-red-50 text-red-700'
                      : 'bg-[#eff4ff] text-[#4450b7]'
                    : isDanger
                    ? 'text-[#767684] hover:text-red-600 hover:bg-red-50/50'
                    : 'text-[#565e74] hover:text-[#0b1c30] hover:bg-[#f8f9ff]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? (isDanger ? 'text-red-600' : 'text-[#4450b7]') : 'text-[#767684]'}`} />
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-sm p-6">
              <h2 className="text-[15px] font-semibold text-[#0b1c30] font-[Geist,sans-serif] mb-1">Account Information</h2>
              <p className="text-[13px] text-[#565e74] mb-5 font-[Inter,sans-serif]">Core profile credentials associated with your workspace login.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                  <span className="text-[11px] font-semibold text-[#767684] uppercase tracking-wider font-[Geist,sans-serif] block mb-1">
                    Username
                  </span>
                  <span className="text-[14px] text-[#0b1c30] font-semibold font-[Inter,sans-serif]">
                    {user?.username || '—'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                  <span className="text-[11px] font-semibold text-[#767684] uppercase tracking-wider font-[Geist,sans-serif] block mb-1">
                    Email Address
                  </span>
                  <span className="text-[14px] text-[#0b1c30] font-semibold font-[Inter,sans-serif]">
                    {user?.email || 'Not configured'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                  <span className="text-[11px] font-semibold text-[#767684] uppercase tracking-wider font-[Geist,sans-serif] block mb-1">
                    Assigned Role
                  </span>
                  <span className="text-[14px] text-[#0b1c30] font-semibold font-[Inter,sans-serif]">
                    {user?.role || 'Member'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                  <span className="text-[11px] font-semibold text-[#767684] uppercase tracking-wider font-[Geist,sans-serif] block mb-1">
                    Workspace Access
                  </span>
                  <span className="text-[14px] text-emerald-600 font-semibold font-[Inter,sans-serif] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Full Project Collaboration
                  </span>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-[#eff4ff] rounded-xl border border-[#c6d7ff] flex items-start gap-3">
                <Info className="w-4 h-4 text-[#4450b7] mt-0.5 shrink-0" />
                <p className="text-[12px] text-[#454652] leading-relaxed font-[Inter,sans-serif]">
                  Username and organizational role assignments are managed by workspace administrators. To update email or account permissions, please contact your system administrator.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="w-5 h-5 text-[#4450b7]" />
              <h2 className="text-[15px] font-semibold text-[#0b1c30] font-[Geist,sans-serif]">Change Password</h2>
            </div>
            <p className="text-[13px] text-[#565e74] mb-6 font-[Inter,sans-serif]">
              Keep your account secure with a strong password of at least 6 characters.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              {pwError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[13px] flex items-start gap-2.5 font-[Inter,sans-serif]">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}
              {pwSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-[13px] flex items-start gap-2.5 font-[Inter,sans-serif]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{pwSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[#454652] font-[Geist,sans-serif]">Current Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#767684] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] focus:ring-2 focus:ring-[#4450b7]/15 transition-all font-[Inter,sans-serif]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[#454652] font-[Geist,sans-serif]">New Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#767684] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] focus:ring-2 focus:ring-[#4450b7]/15 transition-all font-[Inter,sans-serif]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[#454652] font-[Geist,sans-serif]">Confirm New Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#767684] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] focus:ring-2 focus:ring-[#4450b7]/15 transition-all font-[Inter,sans-serif]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="h-10 px-6 bg-[#4450b7] hover:bg-[#3540a0] disabled:opacity-60 text-white text-[13px] font-semibold rounded-xl transition-all font-[Geist,sans-serif] shadow-sm flex items-center gap-2 mt-2"
              >
                {pwLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-red-200 bg-red-50/70 flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h2 className="text-[15px] font-semibold font-[Geist,sans-serif]">Irreversible Actions</h2>
                <p className="text-[12px] text-red-600/80 font-[Inter,sans-serif]">Actions taken here cannot be undone.</p>
              </div>
            </div>

            <div className="p-6">
              <div className="border border-red-200 rounded-xl p-5 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[14px] font-bold text-red-600 font-[Geist,sans-serif] flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      Delete Account
                    </h3>
                    <p className="text-[13px] text-[#565e74] mt-1 mb-4 font-[Inter,sans-serif] leading-relaxed max-w-xl">
                      Permanently remove your account and revoke your access. To verify this request, enter your username below.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-w-md">
                  <label className="text-[12px] text-[#454652] font-[Inter,sans-serif] block">
                    Type <strong className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{user?.username}</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    placeholder={user?.username}
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-red-50/40 border border-red-200 text-[13px] text-[#0b1c30] outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirmModal(true)}
                    disabled={deleteConfirm !== user?.username}
                    className="h-10 px-5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-[13px] font-semibold rounded-xl transition-all font-[Geist,sans-serif] shadow-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete My Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* App-styled Confirm Modal (Item 3) */}
      <ConfirmModal
        isOpen={showDeleteConfirmModal}
        title="Delete Account"
        message={`Are you absolutely sure you want to delete account "${user?.username}"? This action cannot be reversed.`}
        confirmText="Yes, Delete My Account"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirmModal(false)}
      />

      {/* App-styled Alert Modal (Item 3) */}
      <AlertModal
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
      />
    </Layout>
  )
}
