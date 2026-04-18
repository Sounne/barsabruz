import React from 'react'
import { Icon, Avatar, BarHero, Tag, OpenDot, shade, Wip } from '../components/ui'
import { useData } from '../context/DataContext'

// Groupes (conversations privées) + Annonces

// ═══════════════ GROUPES LIST ═══════════════
const GroupesScreen = ({ onOpenGroup, onNew }) => {
  const { user } = useData()
  const groups = user.groups;
  const [tab, setTab] = React.useState('all');
  const filtered = tab === 'all' ? groups : groups.filter(g => g.type === tab);

  return (
    <Wip>
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="serif" style={{ fontSize: 28, fontWeight: 600 }}>Groupes</div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>
            {groups.length} conversations privées
          </div>
        </div>
        <button onClick={onNew} style={{
          width: 42, height: 42, borderRadius: '50%',
          background: 'var(--terracotta)', color: '#fff', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-card)', cursor: 'pointer',
        }}>
          <Icon name="plus" size={22} color="#fff"/>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 8 }}>
        {[
          { id: 'all', label: 'Tous' },
          { id: 'permanent', label: 'Permanents' },
          { id: 'ephemeral', label: 'Éphémères' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '7px 14px', borderRadius: 999,
              background: tab === t.id ? 'var(--ink)' : '#fff',
              color: tab === t.id ? '#fff' : 'var(--ink-soft)',
              border: tab === t.id ? 'none' : '1px solid var(--line)',
              fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(g => (
          <div key={g.id} onClick={() => onOpenGroup(g)}
            style={{
              background: '#fff', borderRadius: 16, padding: 14,
              display: 'flex', gap: 12, alignItems: 'center',
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
            }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: g.type === 'ephemeral'
                ? 'linear-gradient(135deg, #D9A44A, #E89579)'
                : 'linear-gradient(135deg, #C65D3D, #6B3A4A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              {g.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{g.name}</span>
                {g.type === 'ephemeral' && (
                  <span style={{
                    fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
                    color: 'var(--ochre-deep)', background: 'rgba(217,164,74,0.15)',
                    padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em',
                  }}>
                    {g.expiresIn}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {g.lastMsg}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{g.time}</div>
              {g.unread > 0 && (
                <div style={{
                  background: 'var(--terracotta)', color: '#fff',
                  fontSize: 11, fontWeight: 600, borderRadius: 999,
                  padding: '2px 7px', marginTop: 4, display: 'inline-block',
                }}>
                  {g.unread}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Create prompt */}
        <div onClick={onNew} style={{
          marginTop: 14, padding: 18, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(198,93,61,0.08), rgba(217,164,74,0.08))',
          border: '1px dashed rgba(198,93,61,0.3)',
          textAlign: 'center', cursor: 'pointer',
        }}>
          <div style={{ fontSize: 26 }}>🎉</div>
          <div className="serif" style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>
            Organise une soirée
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
            Crée un groupe éphémère et invite tes amis
          </div>
        </div>
      </div>
    </div>
    </Wip>
  );
};

// ═══════════════ GROUP CHAT (detail) ═══════════════
const GroupChatScreen = ({ group, onBack }) => {
  const [messages, setMessages] = React.useState([
    { id: 1, from: 'Phil',    avatar: 'P', color: '#6B3A4A', text: "Salut les amis ! On se fait quoi ce weekend ?", time: "14:20" },
    { id: 2, from: 'Clément', avatar: 'C', color: '#6D7A3D', text: "L'Ostal propose une dégustation vendredi 🍷", time: "14:22" },
    { id: 3, from: 'me',      avatar: 'E', color: '#C65D3D', text: "Je suis chaud ! Qui vient ?", time: "14:28" },
    { id: 4, from: 'Sarah',   avatar: 'S', color: '#D9A44A', text: "Moi 🙋‍♀️", time: "14:30", reactions: ['🔥','👍'] },
    { id: 5, from: 'Clément', avatar: 'C', color: '#6D7A3D', text: group.lastMsg, time: "14:32", shared: {
      type: 'event', title: "Soirée dégustation — vins du Languedoc", bar: "L'Ostal", when: "Ven. 25 avril 19:30",
    }},
  ]);
  const [input, setInput] = React.useState('');

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), from: 'me', avatar: 'L', color: '#C65D3D', text: input, time: "Maintenant" }]);
    setInput('');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '54px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#fff', borderBottom: '1px solid var(--line)',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', padding: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <Icon name="back" size={22} color="var(--ink)"/>
        </button>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: group.type === 'ephemeral'
            ? 'linear-gradient(135deg, #D9A44A, #E89579)'
            : 'linear-gradient(135deg, #C65D3D, #6B3A4A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{group.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{group.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="lock" size={10}/> Privé · {group.members} membres
          </div>
        </div>
        <Icon name="more" size={22} color="var(--ink-soft)"/>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '16px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {group.type === 'ephemeral' && (
          <div style={{
            alignSelf: 'center', padding: '8px 14px', borderRadius: 999,
            background: 'rgba(217,164,74,0.15)', color: 'var(--ochre-deep)',
            fontSize: 11, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon name="clock" size={12} color="var(--ochre-deep)"/>
            Groupe éphémère · disparaît dans {group.expiresIn}
          </div>
        )}
        {messages.map(m => {
          const me = m.from === 'me';
          return (
            <div key={m.id} style={{
              display: 'flex', gap: 8, flexDirection: me ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
            }}>
              {!me && <Avatar letter={m.avatar} color={m.color} size={28}/>}
              <div style={{ maxWidth: '75%' }}>
                {!me && <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 3, fontWeight: 500 }}>{m.from}</div>}
                <div style={{
                  padding: '9px 13px',
                  background: me ? 'var(--terracotta)' : '#fff',
                  color: me ? '#fff' : 'var(--ink)',
                  borderRadius: 16,
                  borderBottomRightRadius: me ? 4 : 16,
                  borderBottomLeftRadius: me ? 16 : 4,
                  fontSize: 14, lineHeight: 1.35,
                  boxShadow: me ? 'none' : '0 1px 2px rgba(42,31,23,0.05)',
                }}>
                  {m.text}
                  {m.shared && (
                    <div style={{
                      marginTop: 8, background: me ? 'rgba(255,255,255,0.15)' : 'rgba(198,93,61,0.08)',
                      borderRadius: 10, padding: 10,
                      border: me ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(198,93,61,0.15)',
                    }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, opacity: 0.75 }}>
                        📅 Événement partagé
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{m.shared.title}</div>
                      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{m.shared.bar} · {m.shared.when}</div>
                    </div>
                  )}
                </div>
                {m.reactions && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: me ? 'flex-end' : 'flex-start' }}>
                    {m.reactions.map((r, i) => (
                      <span key={i} style={{
                        fontSize: 12, padding: '2px 7px', borderRadius: 999,
                        background: '#fff', boxShadow: 'var(--shadow-card)',
                      }}>{r}</span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 3, textAlign: me ? 'right' : 'left' }}>
                  {m.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px 14px', background: '#fff', borderTop: '1px solid var(--line)' }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--paper)', borderRadius: 999, padding: '6px 6px 6px 16px',
        }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Message…"
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 14, outline: 'none', fontFamily: 'inherit',
              padding: '8px 0',
            }}/>
          <button onClick={send} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: input.trim() ? 'var(--terracotta)' : 'var(--line)',
            color: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}>
            <Icon name="send" size={16} color="#fff"/>
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════ NEW ANNONCE SHEET ═══════════════
const NewAnnonceSheet = ({ onClose }) => {
  const { bars: BARS_DATA } = useData()
  const [step, setStep] = React.useState(1);
  const [type, setType] = React.useState('soirée');
  const [privacy, setPrivacy] = React.useState('public');
  const [bar, setBar] = React.useState('ostal');
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width: '100%', background: 'var(--paper)',
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          maxHeight: '90%', overflow: 'auto',
          animation: 'slideUp 0.25s',
        }}>
        <div style={{ padding: '14px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Nouvelle annonce</div>
          <div style={{ fontSize: 14, color: 'var(--terracotta)', fontWeight: 600 }}>Publier</div>
        </div>
        <div style={{ padding: 20 }}>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>
            Organise une sortie
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>
            En 3 étapes : le quoi, le où, le qui.
          </div>

          {/* Type */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>
              Type
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'soirée', label: 'Apéro / soirée', icon: 'cocktail' },
                { id: 'anniv', label: 'Anniversaire', icon: 'cake' },
                { id: 'after', label: 'Afterwork', icon: 'beer' },
                { id: 'match', label: 'Match', icon: 'flame' },
              ].map(t => (
                <button key={t.id} onClick={() => setType(t.id)}
                  style={{
                    padding: '10px 14px', borderRadius: 12,
                    background: type === t.id ? 'var(--ink)' : '#fff',
                    color: type === t.id ? '#fff' : 'var(--ink)',
                    border: type === t.id ? 'none' : '1px solid var(--line)',
                    fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  <Icon name={t.icon} size={15} color={type === t.id ? '#fff' : 'var(--ink-soft)'}/>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>
              Titre
            </div>
            <input placeholder="Ex. Anniv de Théo 🎂"
              defaultValue="Qui est chaud ce soir ?"
              style={{
                width: '100%', background: '#fff', border: 'none',
                padding: '14px 14px', borderRadius: 12, fontSize: 15,
                fontFamily: 'inherit', outline: 'none',
                boxShadow: 'var(--shadow-card)',
              }}/>
          </div>

          {/* Bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>
              Bar
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {BARS_DATA.map(b => (
                <button key={b.id} onClick={() => setBar(b.id)}
                  style={{
                    flex: 1, padding: 10, borderRadius: 12,
                    background: bar === b.id ? b.color : '#fff',
                    color: bar === b.id ? '#fff' : 'var(--ink)',
                    border: bar === b.id ? 'none' : '1px solid var(--line)',
                    fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}>
                  <Icon name={{ostal:'wine',pignom:'beer','arriere-cour':'cocktail'}[b.id]} size={18} color={bar === b.id ? '#fff' : b.color}/>
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>
              Visibilité
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'public', label: 'Ouvert à tous', icon: 'globe', sub: 'Visible sur le feed public' },
                { id: 'group', label: 'Groupe privé', icon: 'lock', sub: 'Seulement les membres invités' },
              ].map(p => (
                <button key={p.id} onClick={() => setPrivacy(p.id)}
                  style={{
                    flex: 1, padding: 12, borderRadius: 12, textAlign: 'left',
                    background: privacy === p.id ? 'rgba(198,93,61,0.08)' : '#fff',
                    border: privacy === p.id ? '2px solid var(--terracotta)' : '1px solid var(--line)',
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}>
                  <Icon name={p.icon} size={18} color={privacy === p.id ? 'var(--terracotta)' : 'var(--ink-soft)'}/>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6, color: 'var(--ink)' }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, lineHeight: 1.35 }}>{p.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <Wip>
            <button style={{
              width: '100%', marginTop: 24,
              background: 'var(--terracotta)', color: '#fff', border: 'none',
              padding: 16, borderRadius: 14,
              fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
              cursor: 'pointer',
            }}>Publier l'annonce</button>
          </Wip>
        </div>
      </div>
    </div>
  );
};

export { GroupesScreen, GroupChatScreen, NewAnnonceSheet };
