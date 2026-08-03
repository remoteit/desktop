import React from 'react'
import { EventIcon } from 'remoteit-desktop-frontend'

/**
 * EventIcon is the leading glyph on every row of the activity log. It takes a
 * whole IEvent and derives icon + palette color from `type` (and, for a few
 * types, from `state` / `action` / `actor`), so the preview has to build real
 * event objects rather than pass an icon name.
 */

const loggedInUser: any = { id: 'u-8f21', email: 'jamie@remote.it' }

const event = (over: Record<string, any>): any => ({
  id: 'ev-1c4a',
  shared: false,
  scripting: false,
  timestamp: new Date('2024-11-04T18:22:00Z'),
  action: '',
  ...over,
})

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>{children}</div>
)

/* A 34px well behind the glyph: these are 16px icons on a white sheet, and
   without a ground they read as an empty cell. */
const Cell: React.FC<{ label: string; children?: React.ReactNode; width?: number }> = ({
  label,
  children,
  width = 118,
}) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 7, width }}>
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
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

/** Account-level events — the top half of the personal activity log. */
export const AccountEvents = () => (
  <Row>
    <Cell label="AUTH_LOGIN · primary">
      <EventIcon item={event({ type: 'AUTH_LOGIN', actor: loggedInUser })} loggedInUser={loggedInUser} />
    </Cell>
    <Cell label="AUTH_LOGIN_ATTEMPT · grayDarker">
      <EventIcon
        item={event({ type: 'AUTH_LOGIN_ATTEMPT', actor: { email: 'contractor@example.com' } })}
        loggedInUser={loggedInUser}
      />
    </Cell>
    <Cell label="AUTH_PHONE_CHANGE · grayDarker">
      <EventIcon item={event({ type: 'AUTH_PHONE_CHANGE', actor: loggedInUser })} loggedInUser={loggedInUser} />
    </Cell>
    <Cell label="AUTH_MFA_ENABLED · success">
      <EventIcon item={event({ type: 'AUTH_MFA_ENABLED', actor: loggedInUser })} loggedInUser={loggedInUser} />
    </Cell>
    <Cell label="LICENSE_UPDATED · primary">
      <EventIcon item={event({ type: 'LICENSE_UPDATED' })} loggedInUser={loggedInUser} />
    </Cell>
    <Cell label="DEVICE_REFRESH → default · unknown">
      <EventIcon item={event({ type: 'DEVICE_REFRESH' })} loggedInUser={loggedInUser} />
    </Cell>
  </Row>
)

/**
 * Device events. `DEVICE_STATE` and `DEVICE_CONNECT` branch on `state`, and
 * `DEVICE_SHARE` branches on `action` — same type, different glyph and color.
 */
export const DeviceEvents = () => (
  <Row>
    <Cell label="DEVICE_STATE · state='active' · online">
      <EventIcon
        item={event({
          type: 'DEVICE_STATE',
          state: 'active',
          devices: [{ id: 'd-9012', name: 'shop-floor-pi' }],
        })}
        loggedInUser={loggedInUser}
      />
    </Cell>
    <Cell label="DEVICE_CONNECT · state='connected'">
      <EventIcon
        item={event({
          type: 'DEVICE_CONNECT',
          state: 'connected',
          target: [{ id: 's-33a1', name: 'SSH', device: { id: 'd-9012', name: 'shop-floor-pi' } }],
        })}
        loggedInUser={loggedInUser}
      />
    </Cell>
    <Cell label="DEVICE_CONNECT · disconnected">
      <EventIcon
        item={event({
          type: 'DEVICE_CONNECT',
          state: 'disconnected',
          target: [{ id: 's-33a1', name: 'SSH', device: { id: 'd-9012', name: 'shop-floor-pi' } }],
        })}
        loggedInUser={loggedInUser}
      />
    </Cell>
    <Cell label="DEVICE_SHARE · action='add' · success">
      <EventIcon
        item={event({
          type: 'DEVICE_SHARE',
          action: 'add',
          users: [{ email: 'ops@remote.it' }],
          devices: [{ id: 'd-4470', name: 'warehouse-gateway' }],
        })}
        loggedInUser={loggedInUser}
      />
    </Cell>
    <Cell label="DEVICE_DELETE · danger">
      <EventIcon
        item={event({ type: 'DEVICE_DELETE', devices: [{ id: 'd-4470', name: 'warehouse-gateway' }] })}
        loggedInUser={loggedInUser}
      />
    </Cell>
  </Row>
)

/**
 * `JOB` and `DEVICE_JOB` delegate to JobStatusIcon, upper-casing `action` into
 * an IJobStatus — the full script-run status set as it appears in the log.
 */
export const ScriptRunEvents = () => (
  <Row>
    {['ready', 'waiting', 'running', 'success', 'failed', 'cancelled'].map(action => (
      <Cell key={action} label={`DEVICE_JOB · action='${action}'`}>
        <EventIcon
          item={event({
            type: 'DEVICE_JOB',
            action,
            job: { file: { name: 'rotate-certs.sh' } },
            devices: [{ id: 'd-9012', name: 'shop-floor-pi' }],
          })}
          loggedInUser={loggedInUser}
        />
      </Cell>
    ))}
  </Row>
)

/** In context: the device activity log, icon column beside the message text. */
export const InActivityLog = () => {
  const rows: [any, string, string][] = [
    [
      event({ type: 'DEVICE_STATE', state: 'active', devices: [{ id: 'd-9012', name: 'shop-floor-pi' }] }),
      'shop-floor-pi came online',
      '10:04 am',
    ],
    [
      event({
        type: 'DEVICE_CONNECT',
        state: 'connected',
        target: [{ id: 's-33a1', name: 'SSH', device: { id: 'd-9012', name: 'shop-floor-pi' } }],
      }),
      'jamie@remote.it connected to shop-floor-pi - SSH on port 33000',
      '10:04 am',
    ],
    [
      event({
        type: 'DEVICE_JOB',
        action: 'success',
        job: { file: { name: 'rotate-certs.sh' } },
        devices: [{ id: 'd-9012', name: 'shop-floor-pi' }],
      }),
      'Script rotate-certs.sh ran successfully on shop-floor-pi',
      '9:47 am',
    ],
    [
      event({
        type: 'DEVICE_SHARE',
        action: 'add',
        users: [{ email: 'ops@remote.it' }],
        devices: [{ id: 'd-4470', name: 'warehouse-gateway' }],
      }),
      'You shared warehouse-gateway with ops@remote.it',
      '9:12 am',
    ],
    [event({ type: 'AUTH_LOGIN', actor: loggedInUser }), 'You logged in', '8:58 am'],
    [
      event({ type: 'DEVICE_DELETE', devices: [{ id: 'd-1188', name: 'lab-bench-nano' }] }),
      'You deleted lab-bench-nano',
      'Yesterday',
    ],
  ]
  return (
    <div style={{ width: 440, fontFamily: 'system-ui' }}>
      {rows.map(([item, message, time], i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '9px 4px',
            borderBottom: i === rows.length - 1 ? 'none' : '1px solid #eceef0',
          }}
        >
          <span style={{ display: 'flex', width: 20, justifyContent: 'center' }}>
            <EventIcon item={item} loggedInUser={loggedInUser} />
          </span>
          <span style={{ fontSize: 12.5, flex: 1 }}>{message}</span>
          <span style={{ fontSize: 11, opacity: 0.5 }}>{time}</span>
        </div>
      ))}
    </div>
  )
}
