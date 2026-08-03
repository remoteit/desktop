import React from 'react'
import { JobStatusIcon } from 'remoteit-desktop-frontend'

/**
 * JobStatusIcon is the status glyph for a script run — on the scripts list, on
 * each job's device rows, and (via EventIcon) in the activity log. `status` is
 * an IJobStatus: READY | WAITING | RUNNING | FAILED | SUCCESS | CANCELLED.
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
        width: 38,
        height: 38,
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

/** The full IJobStatus union — every status a script run can report. */
export const Statuses = () => (
  <Row>
    {(
      [
        ['READY', 'circle-play · primary'],
        ['WAITING', 'circle-dot · info'],
        ['RUNNING', 'ellipsis · primary'],
        ['SUCCESS', 'badge-check · primary'],
        ['FAILED', 'octagon-xmark · error'],
        ['CANCELLED', 'octagon-xmark · error'],
      ] as const
    ).map(([status, detail]) => (
      <Cell key={status} label={`${status} · ${detail}`} width={112}>
        <JobStatusIcon status={status} showTooltip={false} />
      </Cell>
    ))}
  </Row>
)

/** No `status` at all — the neutral scroll used for a script never yet run. */
export const NoStatus = () => (
  <Row>
    <Cell label="status undefined · scroll · gray">
      <JobStatusIcon showTooltip={false} />
    </Cell>
    <Cell label="status undefined · size='lg'">
      <JobStatusIcon size="lg" showTooltip={false} />
    </Cell>
    <Cell label="SUCCESS for contrast">
      <JobStatusIcon status="SUCCESS" showTooltip={false} />
    </Cell>
    <Cell label="FAILED for contrast">
      <JobStatusIcon status="FAILED" showTooltip={false} />
    </Cell>
  </Row>
)

/** `size` forwards to Icon — `base` is the default, `lg` is used in headers. */
export const Sizes = () => (
  <Row>
    {(['xs', 'sm', 'base', 'md', 'lg', 'xl'] as const).map(size => (
      <Cell key={size} label={size === 'base' ? "size='base' (default)" : `size='${size}'`}>
        <JobStatusIcon status="SUCCESS" size={size} showTooltip={false} />
      </Cell>
    ))}
  </Row>
)

/** `padding` (default 0.7 theme units) is how EventIcon flattens it to 0. */
export const Padding = () => (
  <Row>
    {[0, 0.7, 1.5, 3].map(padding => (
      <Cell key={padding} label={padding === 0.7 ? 'padding=0.7 (default)' : `padding=${padding}`}>
        <span style={{ background: 'rgba(0,150,231,0.12)', display: 'inline-flex', borderRadius: 4 }}>
          <JobStatusIcon status="RUNNING" padding={padding} showTooltip={false} />
        </span>
      </Cell>
    ))}
  </Row>
)

/** In context: the per-device rows of a script run. */
export const InJobDeviceList = () => {
  const devices: [any, string, string][] = [
    ['SUCCESS', 'shop-floor-pi', 'Completed in 4s'],
    ['SUCCESS', 'warehouse-gateway', 'Completed in 6s'],
    ['RUNNING', 'dock-door-3', 'Running…'],
    ['WAITING', 'lab-bench-nano', 'Queued'],
    ['FAILED', 'kiosk-front-desk', 'Exit code 1'],
    ['CANCELLED', 'spare-pi-4', 'Cancelled by jamie@remote.it'],
  ]
  return (
    <div style={{ width: 360, fontFamily: 'system-ui' }}>
      <div style={{ fontSize: 12, fontWeight: 600, padding: '0 4px 6px' }}>rotate-certs.sh</div>
      {devices.map(([status, name, detail], i) => (
        <div
          key={name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 4px',
            borderBottom: i === devices.length - 1 ? 'none' : '1px solid #eceef0',
          }}
        >
          <JobStatusIcon status={status} showTooltip={false} />
          <span style={{ fontSize: 12.5, flex: 1 }}>{name}</span>
          <span style={{ fontSize: 11, opacity: 0.55 }}>{detail}</span>
        </div>
      ))}
    </div>
  )
}
