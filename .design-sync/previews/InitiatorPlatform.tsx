import React from 'react'
import { InitiatorPlatform } from 'remoteit-desktop-frontend'

/**
 * InitiatorPlatform maps the numeric platform id the API reports for a session
 * initiator onto a glyph. Ids come from the INITIATOR_PLATFORMS table in the
 * component source; the captions below use that table's own labels.
 */

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode; width?: number }> = ({
  label,
  children,
  width = 104,
}) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 7, width }}>
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        background: '#f0f2f4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
    <span
      style={{
        fontSize: 11,
        lineHeight: 1.35,
        opacity: 0.55,
        fontFamily: 'system-ui',
        textAlign: 'center',
        wordBreak: 'break-word',
      }}
    >
      {label}
    </span>
  </div>
)

/** Desktop and web initiators. */
export const DesktopPlatforms = () => (
  <Row>
    <Cell label="id=3 · Mac Desktop">
      <InitiatorPlatform id={3} />
    </Cell>
    <Cell label="id=4 · Mac">
      <InitiatorPlatform id={4} />
    </Cell>
    <Cell label="id=16 · Java Mac">
      <InitiatorPlatform id={16} />
    </Cell>
    <Cell label="id=5 · Web">
      <InitiatorPlatform id={5} />
    </Cell>
    <Cell label="id=8 · Generic">
      <InitiatorPlatform id={8} />
    </Cell>
  </Row>
)

/** Mobile and tablet initiators — the remote.it mobile app. */
export const MobilePlatforms = () => (
  <Row>
    <Cell label="id=9 · Phone">
      <InitiatorPlatform id={9} />
    </Cell>
    <Cell label="id=10 · iPhone/IOS">
      <InitiatorPlatform id={10} />
    </Cell>
    <Cell label="id=11 · iPad">
      <InitiatorPlatform id={11} />
    </Cell>
    <Cell label="id=12 · iTouch">
      <InitiatorPlatform id={12} />
    </Cell>
    <Cell label="id=14 · Android">
      <InitiatorPlatform id={14} />
    </Cell>
  </Row>
)

/**
 * Unmapped / missing ids fall through to a role-based glyph: `user` for a
 * person, `laptop` for this machine, otherwise a router (a remote device).
 */
export const Fallbacks = () => (
  <Row>
    <Cell label="id=17 · Unknown → router">
      <InitiatorPlatform id={17} />
    </Cell>
    <Cell label="id=18 · BSD → router">
      <InitiatorPlatform id={18} />
    </Cell>
    <Cell label="id undefined → router">
      <InitiatorPlatform />
    </Cell>
    <Cell label="user → person">
      <InitiatorPlatform user />
    </Cell>
    <Cell label="thisDevice → laptop">
      <InitiatorPlatform thisDevice />
    </Cell>
  </Row>
)

/** `connected` tints the glyph brand blue and adds the platform tooltip. */
export const ConnectedState = () => (
  <Row>
    {(
      [
        [4, 'Mac'],
        [10, 'iPhone/IOS'],
        [14, 'Android'],
        [5, 'Web'],
      ] as const
    ).map(([id, name]) => (
      <React.Fragment key={id}>
        <Cell label={`id=${id} · ${name}`}>
          <InitiatorPlatform id={id} />
        </Cell>
        <Cell label={`id=${id} · connected`}>
          <InitiatorPlatform id={id} connected />
        </Cell>
      </React.Fragment>
    ))}
  </Row>
)

/** In context: the active-sessions list on a device page. */
export const InSessionList = () => {
  const sessions: [number, boolean, string, string][] = [
    [4, true, 'jamie@remote.it', 'shop-floor-pi - SSH'],
    [10, true, 'ops@remote.it', 'warehouse-gateway - VNC'],
    [14, false, 'contractor@example.com', 'warehouse-gateway - HTTP'],
    [5, false, 'jamie@remote.it', 'lab-bench-nano - TCP 33000'],
  ]
  return (
    <div style={{ width: 360, fontFamily: 'system-ui' }}>
      {sessions.map(([id, connected, email, service], i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '9px 4px',
            borderBottom: i === sessions.length - 1 ? 'none' : '1px solid #eceef0',
          }}
        >
          <span style={{ display: 'flex', width: 22, justifyContent: 'center' }}>
            <InitiatorPlatform id={id} connected={connected} />
          </span>
          <span style={{ display: 'grid', flex: 1 }}>
            <span style={{ fontSize: 12.5 }}>{email}</span>
            <span style={{ fontSize: 11, opacity: 0.55 }}>{service}</span>
          </span>
          <span style={{ fontSize: 11, opacity: 0.55 }}>{connected ? 'Connected' : 'Idle'}</span>
        </div>
      ))}
    </div>
  )
}
