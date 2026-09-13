import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Avatar from '../components/Avatar'
import { apiDeleteUser } from '../api/client'
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

  // Password change uses the /api/users/{id}/password endpoint
  // But the backend's PATCH /api/users/{id}/password has a quirk (two @RequestBody params)
  // We'll use a custom fetch approach
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    if (!pwForm.currentPassword || !pwForm.newPassword) { setPwError('Please fill in all fields.'); return }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('New passwords do not match.'); return }
    if (pwForm.newPassword.length < 6) { setPwError('Password must be at least 6 characters.'); return }

    setPwLoading(true)
    try {
      // Using raw fetch since the API endpoint has dual @RequestBody parameters
      // The backend UsersService.updatePassword accepts (id, currentPassword, newPassword)
      // We'll POST to the dedicated endpoint
      const token = localStorage.getItem('jwt_token')
      const usersData = await (await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })).json()
      const usersList = Array.isArray(usersData) ? usersData : []
      const currentUser = usersList.find(u => u.username === user?.username)
      if (!currentUser) { setPwError('User not found.'); return }

      // Use PATCH with JSON body workaround — send as JSON object
      const res = await fetch(`/api/users/${currentUser.userId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      })
      if (!res.ok) {
        const text = await res.text()
        setPwError(text || 'Failed to change password.')
      } else {
        setPwSuccess('Password updated successfully!')
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch {
      setPwError('Failed to change password. Please try again.')
    } finally {
      setPwLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username) return
    try {
      const token = localStorage.getItem('jwt_token')
      const usersData = await (await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })).json()
      const usersList = Array.isArray(usersData) ? usersData : []
      const currentUser = usersList.find(u => u.username === user?.username)
      if (currentUser) {
        await apiDeleteUser(currentUser.userId)
      }
      logout()
      navigate('/login')
    } catch {
      alert('Failed to delete account.')
    }
  }

  const TABS = [
    { id: 'account', label: 'Account', icon: 'person' },
    { id: 'security', label: 'Security', icon: 'lock' },
    { id: 'danger', label: 'Danger Zone', icon: 'warning' },
  ]

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[#0b1c30] tracking-tight font-[Geist,sans-serif]">Account Settings</h1>
          <p className="text-[13px] text-[#565e74] mt-0.5 font-[Inter,sans-serif]">Manage your profile, security, and preferences.</p>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 mb-5 border-b border-[#e5eeff]">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px font-[Geist,sans-serif] ${
                activeTab === id
                  ? 'border-[#4450b7] text-[#4450b7]'
                  : 'border-transparent text-[#565e74] hover:text-[#0b1c30]'
              } ${id === 'danger' ? 'text-[#dc2626] hover:text-[#dc2626]' : ''}`}
            >
              <span className="material-symbols-outlined text-[16px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Account tab */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-xl border border-[#e5eeff] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#e5eeff] flex items-center gap-5">
              <Avatar name={user?.username} size="lg" />
              <div>
                <h2 className="text-[16px] font-semibold text-[#0b1c30] font-[Geist,sans-serif]">{user?.username}</h2>
                <p className="text-[13px] text-[#565e74] font-[Inter,sans-serif]">{user?.email || 'No email set'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#4450b7] text-[11px] font-semibold font-[Geist,sans-serif]">
                  {user?.role || 'Member'}
                </span>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="flex flex-col gap-3">
                {[
                  { label: 'USERNAME', value: user?.username || '—' },
                  { label: 'EMAIL', value: user?.email || 'Not set' },
                  { label: 'ROLE', value: user?.role || 'Member' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-[#f1f5ff] last:border-0">
                    <span className="text-[11px] font-semibold text-[#767684] uppercase tracking-wider font-[Geist,sans-serif]">{label}</span>
                    <span className="text-[13px] text-[#0b1c30] font-medium font-[Inter,sans-serif]">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-[#eff4ff] rounded-lg border border-[#e5eeff]">
                <p className="text-[12px] text-[#565e74] font-[Inter,sans-serif]">
                  <span className="material-symbols-outlined text-[14px] text-[#4450b7] align-text-bottom mr-1">info</span>
                  Profile editing is managed by your workspace administrator. Contact support to update your details.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl border border-[#e5eeff] shadow-sm">
            <div className="px-6 py-4 border-b border-[#e5eeff]">
              <h2 className="text-[15px] font-semibold text-[#0b1c30] font-[Geist,sans-serif]">Change Password</h2>
              <p className="text-[13px] text-[#565e74] mt-0.5 font-[Inter,sans-serif]">Update your password to keep your account secure.</p>
            </div>
            <form onSubmit={handleChangePassword} className="px-6 py-5 flex flex-col gap-4">
              {pwError && (
                <div className="bg-[#ffdad6] border border-[#ffb4a9] rounded-lg px-3 py-2.5 text-[13px] text-[#ba1a1a] font-[Inter,sans-serif]">{pwError}</div>
              )}
              {pwSuccess && (
                <div className="bg-[#dcfce7] border border-[#86efac] rounded-lg px-3 py-2.5 text-[13px] text-[#15803d] font-[Inter,sans-serif]">{pwSuccess}</div>
              )}
              {[
                { key: 'currentPassword', label: 'Current Password', auto: 'current-password' },
                { key: 'newPassword', label: 'New Password', auto: 'new-password' },
                { key: 'confirmPassword', label: 'Confirm New Password', auto: 'new-password' },
              ].map(({ key, label, auto }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-[#454652] uppercase tracking-wider font-[Geist,sans-serif]">{label}</label>
                  <input
                    type="password"
                    autoComplete={auto}
                    placeholder="••••••••"
                    value={pwForm[key]}
                    onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg bg-[#f8f9ff] border border-[#c6c5d5] text-[13px] text-[#0b1c30] outline-none focus:border-[#4450b7] focus:ring-2 focus:ring-[#4450b7]/20 transition-all font-[Inter,sans-serif]"
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={pwLoading}
                className="h-9 px-5 bg-[#4450b7] hover:bg-[#3540a0] disabled:opacity-60 text-white text-[13px] font-semibold rounded-lg transition-all self-start font-[Geist,sans-serif]"
              >
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Danger Zone tab */}
        {activeTab === 'danger' && (
          <div className="bg-white rounded-xl border border-[#fecaca] shadow-sm">
            <div className="px-6 py-4 border-b border-[#fecaca] bg-[#fef2f2]">
              <h2 className="text-[15px] font-semibold text-[#dc2626] flex items-center gap-2 font-[Geist,sans-serif]">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                Danger Zone
              </h2>
              <p className="text-[13px] text-[#7f1d1d] mt-0.5 font-[Inter,sans-serif]">These actions are permanent and cannot be undone.</p>
            </div>
            <div className="px-6 py-5">
              <div className="border border-[#fecaca] rounded-lg p-4">
                <h3 className="text-[14px] font-semibold text-[#dc2626] font-[Geist,sans-serif]">Delete Account</h3>
                <p className="text-[13px] text-[#565e74] mt-1 mb-4 font-[Inter,sans-serif]">
                  Permanently delete your account and all associated data. This action cannot be reversed.
                </p>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] text-[#454652] font-[Inter,sans-serif]">
                    Type <strong className="font-mono text-[#dc2626]">{user?.username}</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    placeholder={user?.username}
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[#fff5f5] border border-[#fecaca] text-[13px] text-[#0b1c30] outline-none focus:border-[#dc2626] transition-all font-mono"
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== user?.username}
                    className="h-9 px-5 bg-[#dc2626] hover:bg-[#b91c1c] disabled:opacity-40 text-white text-[13px] font-semibold rounded-lg transition-all self-start font-[Geist,sans-serif]"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
