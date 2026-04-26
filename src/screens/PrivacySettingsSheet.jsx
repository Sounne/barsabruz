import React from 'react'
import { Icon } from '../components/ui'
import { useData } from '../context/DataContext'

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    style={{
      width: 46,
      height: 28,
      borderRadius: 999,
      border: 'none',
      padding: 3,
      background: checked ? 'var(--terracotta)' : 'var(--line-strong)',
      cursor: 'pointer',
      transition: 'background 0.18s',
      flexShrink: 0,
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

const privacyGroups = [
  {
    title: 'Profil',
    rows: [
      { key: 'profilePublic', icon: 'globe', label: 'Profil public', detail: 'Visible par tous · sinon limité à tes amis' },
      { key: 'discoverable', icon: 'search', label: 'Apparaître dans les recherches', detail: 'Les autres peuvent te trouver pour t\'ajouter' },
      { key: 'showStats', icon: 'check', label: 'Afficher mes statistiques', detail: 'Sorties, groupes et amis sur ton profil' },
    ],
  },
  {
    title: 'Interactions',
    rows: [
      { key: 'messagesFromAll', icon: 'bell', label: 'Messages de tous', detail: 'Sinon, seuls tes amis peuvent t\'écrire' },
      { key: 'invitesFromAll', icon: 'users', label: 'Invitations de tous', detail: 'Sinon, seuls tes amis peuvent t\'inviter aux sorties' },
      { key: 'shareJoinedSorties', icon: 'pin', label: 'Partager les sorties rejointes', detail: 'Tes amis voient les sorties auxquelles tu participes' },
    ],
  },
]

const PrivacySettingsSheet = ({ onClose }) => {
  const { privacySettings, updatePrivacySetting } = useData()

  return (
    <div style={{ padding: '14px 20px 32px' }}>
      {/* Handle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--line-strong)' }}/>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1 }}>Confidentialité</div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 5 }}>Choisis qui peut te voir et te contacter.</div>
        </div>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: 'rgba(42,31,23,0.08)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}>
          <Icon name="close" size={16} color="var(--ink-mute)"/>
        </button>
      </div>

      {privacyGroups.map(group => (
        <div key={group.title} style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: 'var(--ink-mute)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            marginBottom: 8, paddingLeft: 4,
          }}>
            {group.title}
          </div>
          <div style={{
            background: '#fff', borderRadius: 16, overflow: 'hidden',
            border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)',
          }}>
            {group.rows.map((row, i) => {
              const active = !!privacySettings?.[row.key]
              return (
                <div key={row.key} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
                  borderBottom: i < group.rows.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: active ? 'rgba(198,93,61,0.11)' : 'rgba(42,31,23,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={row.icon} size={16} color={active ? 'var(--terracotta)' : 'var(--ink-mute)'}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{row.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>{row.detail}</div>
                  </div>
                  <Toggle checked={active} onChange={v => updatePrivacySetting(row.key, v)}/>
                </div>
              )
            })}
          </div>
        </div>
      ))}

    </div>
  )
}

export { PrivacySettingsSheet }
