import { useState, useEffect, useRef } from 'react'
import { notificationAPI } from '../api/index'

const TYPE_ICON = {
  payment_submitted: '💰',
  payment_approved: '✅',
  payment_rejected: '❌',
  task_graded: '📝',
  support_message: '💬',
  support_reply: '💬',
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'abhi abhi'
  if (diff < 3600) return `${Math.floor(diff / 60)}m pehle`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h pehle`
  return `${Math.floor(diff / 86400)}d pehle`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getMyNotifications()
      setNotifications(res.data.notifications || [])
      setUnreadCount(res.data.unread_count || 0)
    } catch (e) {}
  }

  useEffect(() => {
    fetchNotifications()
    const poll = setInterval(fetchNotifications, 10000)
    return () => clearInterval(poll)
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = async () => {
    setOpen((prev) => !prev)
    if (!open && unreadCount > 0) {
      try {
        await notificationAPI.markRead()
        setUnreadCount(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      } catch (e) {}
    }
  }

  const handleClear = async (e) => {
    e.stopPropagation()
    try {
      await notificationAPI.clearAll()
      setNotifications([])
      setUnreadCount(0)
    } catch (e) {}
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={handleOpen} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Notifications">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', color: '#fff', borderRadius: '999px', fontSize: '10px', fontWeight: '700', minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxShadow: '0 0 0 2px #fff' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '320px', background: '#fff', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid #e5e7eb', zIndex: 1000, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>Notifications</span>
            {notifications.length > 0 && (
              <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#6b7280', padding: '2px 6px', borderRadius: '4px' }}>Clear all</button>
            )}
          </div>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
                Koi notification nahi
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} style={{ display: 'flex', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #f9fafb', background: n.is_read ? '#fff' : '#f0f9ff' }}>
                  <div style={{ fontSize: '20px', flexShrink: 0, marginTop: '1px' }}>{TYPE_ICON[n.type] || '🔔'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.is_read ? '500' : '600', fontSize: '13px', color: '#111827', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>{n.body}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: '5px' }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
