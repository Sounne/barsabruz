import React from 'react'
import { Icon, Avatar } from '../components/ui'
import { useData } from '../context/DataContext'

const Toggle = ({ checked, onChange, disabled = false }) => (
  <button
    onClick={() => onChange(!checked)}
    disabled={disabled}
    style={{
      width: 46,
      height: 28,
      borderRadius: 999,
      border: 'none',
      padding: 3,
      background: checked ? 'var(--terracotta)' : 'var(--line-strong)',
      opacity: disabled ? 0.45 : 1,
      cursor: disabled ? 'default' : 'pointer',
      transition: 'background 0.18s',
    }}
    aria-pressed={checked}
  >
    <span style={{
      display: 'block',
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: '#fff',
      transform: checked ? 'translateX(18px)' : 'translateX(0)',
      transition: 'transform 0.18s',
      boxShadow: '0 1px 4px rgba(42,31,23,0.18)',
    }}/>
  </button>
)

const NotificationIcon = ({ notification }) => (
  <div style={{
    width: 38,
    height: 38,
    borderRadius: 12,
    background: `${notification.color || '#C65D3D'}18`,
    color: notification.color || 'var(--terracotta)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }}>
    <Icon name={notification.icon || 'bell'} size={17} color={notification.color || 'var(--terracotta)'}/>
  </div>
)

const NotificationRow = ({ notification, onOpenAnnonce, onOpenEvent }) => {
  const {
    markNotificationRead,
    dismissNotification,
    acceptInvitation,
    declineInvitation,
  } = useData()

  const openTarget = () => {
    markNotificationRead(notification.id)
    if (notification.event) onOpenEvent?.(notification.event)
    if (notification.annonce) onOpenAnnonce?.(notification.annonce)
  }

  const handleAccept = async (e) => {
    e.stopPropagation()
    markNotificationRead(notification.id)
    await acceptInvitation(notification.invitation.invitationId)
  }

  const handleDecline = async (e) => {
    e.stopPropagation()
    markNotificationRead(notification.id)
    await declineInvitation(notification.invitation.invitationId)
  }

  return (
    <div
      onClick={openTarget}
      style={{
        background: notification.read ? '#fff' : 'rgba(198,93,61,0.055)',
        border: notification.read ? '1px solid var(--line)' : '1.5px solid rgba(198,93,61,0.24)',
        borderRadius: 16,
        padding: 13,
        cursor: notification.event || notification.annonce ? 'pointer' : 'default',
        boxShadow: notification.read ? 'none' : 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
        {notification.invitation?.inviter ? (
          <Avatar
            letter={notification.invitation.inviter.avatar_letter}
            src={notification.invitation.inviter.avatar_url}
            color={notification.invitation.inviter.color}
            size={38}
          />
        ) : (
          <NotificationIcon notification={notification}/>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {!notification.read && (
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--terracotta)',
                flexShrink: 0,
              }}/>
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25 }}>
              {notification.title}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.35, marginTop: 4 }}>
            {notification.body}
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginTop: 7 }}>
            {notification.time}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            dismissNotification(notification.id)
          }}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Masquer"
        >
          <Icon name="close" size={14} color="var(--ink-mute)"/>
        </button>
      </div>

      {notification.type === 'invitation' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingLeft: 49 }}>
          <button onClick={handleDecline} style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: 10,
            border: '1px solid var(--line)',
            background: '#fff',
            color: 'var(--ink-soft)',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}>
            Refuser
          </button>
          <button onClick={handleAccept} style={{
            flex: 1.45,
            padding: '9px 0',
            borderRadius: 10,
            border: 'none',
            background: 'var(--terracotta)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}>
            Accepter
          </button>
        </div>
      )}
    </div>
  )
}

const settingRows = [
  { key: 'messages', label: 'Messages', detail: 'DM et messages de groupe' },
  { key: 'invitations', label: 'Invitations de sortie', detail: 'Quand un ami te propose une soiree' },
  { key: 'participants', label: 'Participants', detail: 'Quand quelqu un rejoint une sortie creee' },
  { key: 'sorties', label: 'Nouvelles sorties', detail: 'Les sorties proposees autour de Bruz' },
  { key: 'events', label: 'Evenements', detail: 'Les prochains rendez-vous des bars' },
]

const NotificationsSheet = ({ onClose, onOpenAnnonce, onOpenEvent }) => {
  const {
    notifications,
    unreadNotificationCount,
    socialUnread,
    markAllNotificationsRead,
    notificationSettings,
    updateNotificationSetting,
    notificationPermission,
    webPushStatus,
    requestBrowserNotifications,
    disableBrowserNotifications,
  } = useData()
  const [showSettings, setShowSettings] = React.useState(false)
  const [pushBusy, setPushBusy] = React.useState(false)
  const [markingRead, setMarkingRead] = React.useState(false)
  const totalUnreadCount = unreadNotificationCount + (socialUnread?.total ?? 0)

  const handleBrowserToggle = async (enabled) => {
    setPushBusy(true)
    try {
      if (enabled) {
        await requestBrowserNotifications()
      } else {
        await disableBrowserNotifications()
      }
    } finally {
      setPushBusy(false)
    }
  }

  const browserDetail = (() => {
    if (!webPushStatus.supported) return 'Non supporte sur ce navigateur ou hors HTTPS'
    if (!webPushStatus.configured) return 'Cle VAPID publique a configurer'
    if (notificationPermission === 'denied') return 'Autorisation bloquee dans le navigateur'
    if (webPushStatus.subscribed) return 'Alertes actives meme quand l app est fermee'
    return 'Pour les invitations et participations importantes'
  })()

  const handleMarkAllRead = async () => {
    setMarkingRead(true)
    try {
      await markAllNotificationsRead()
    } finally {
      setMarkingRead(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 220,
        background: 'rgba(42,31,23,0.44)',
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'fadeIn 0.15s',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '88%',
          overflow: 'auto',
          background: 'var(--paper)',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          boxShadow: '0 -12px 36px rgba(42,31,23,0.18)',
          animation: 'slideUp 0.24s',
        }}
      >
        <div style={{ padding: '14px 20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--line-strong)' }}/>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className="serif" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1 }}>
                Notifications
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 5 }}>
                {totalUnreadCount
                  ? `${totalUnreadCount} non lue${totalUnreadCount > 1 ? 's' : ''}`
                  : 'Tout est a jour'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setShowSettings(v => !v)} style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid var(--line)',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <Icon name="filter" size={16} color="var(--ink-soft)"/>
              </button>
              <button onClick={onClose} style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(42,31,23,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <Icon name="close" size={16} color="var(--ink-mute)"/>
              </button>
            </div>
          </div>

          {showSettings && (
            <div style={{
              marginTop: 16,
              background: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid var(--line)',
            }}>
              {settingRows.map((row, i) => (
                <div key={row.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderBottom: i < settingRows.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{row.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>{row.detail}</div>
                  </div>
                  <Toggle
                    checked={notificationSettings[row.key]}
                    onChange={value => updateNotificationSetting(row.key, value)}
                  />
                </div>
              ))}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: 'rgba(198,93,61,0.045)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Alertes du navigateur</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                    {webPushStatus.error || browserDetail}
                  </div>
                </div>
                <Toggle
                  checked={notificationSettings.browser && webPushStatus.subscribed && notificationPermission === 'granted'}
                  onChange={handleBrowserToggle}
                  disabled={pushBusy || !webPushStatus.supported || !webPushStatus.configured || notificationPermission === 'denied'}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Activite
            </div>
            {totalUnreadCount > 0 && (
              <button onClick={handleMarkAllRead} disabled={markingRead} style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--terracotta)',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: markingRead ? 'default' : 'pointer',
                opacity: markingRead ? 0.55 : 1,
              }}>
                {markingRead ? 'Synchronisation...' : 'Tout marquer lu'}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{
              padding: 28,
              textAlign: 'center',
              background: '#fff',
              borderRadius: 18,
              border: '1px dashed var(--line-strong)',
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(198,93,61,0.1)',
                color: 'var(--terracotta)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <Icon name="bell" size={21} color="var(--terracotta)"/>
              </div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Rien pour le moment</div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4 }}>
                Les invitations, sorties et evenements arriveront ici.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {notifications.map(notification => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onOpenAnnonce={onOpenAnnonce}
                  onOpenEvent={onOpenEvent}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { NotificationsSheet }
