import React from 'react'
import { PortScanIcon } from 'remoteit-desktop-frontend'

// PortScanIcon is the reachability glyph the service setup form shows next to a
// target host + port while the daemon probes it: spinner while scanning, green
// check when the port answered, amber warning when it didn't. `port` and `host`
// only feed the hover tooltip ("Service found! 192.168.1.42:22"), so they are
// filled in here with the targets a real remote.it install would scan.

const Grid: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 6, minWidth: 104 }}>
    <div style={{ minHeight: 22, display: 'flex', alignItems: 'center' }}>{children}</div>
    <span style={{ fontSize: 11, opacity: 0.6, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
  </div>
)

// Outlines the slots where the icon is expected to draw nothing, so an empty
// square reads as deliberate rather than broken.
const Empty: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span style={{ border: '1px dashed rgba(0,0,0,0.25)', borderRadius: 4, padding: '2px 10px', minHeight: 22 }}>
    {children}
  </span>
)

// Every state the CLI reports back, in the order the form walks through them.
export const ScanStates = () => (
  <Grid>
    <Cell label="SCANNING">
      <PortScanIcon state="SCANNING" host="192.168.1.42" port={22} />
    </Cell>
    <Cell label="REACHABLE">
      <PortScanIcon state="REACHABLE" host="192.168.1.42" port={22} />
    </Cell>
    <Cell label="UNREACHABLE">
      <PortScanIcon state="UNREACHABLE" host="192.168.1.42" port={5900} />
    </Cell>
    <Cell label="INVALID — glyph absent from preview icon set">
      <Empty>
        <PortScanIcon state="INVALID" host="" port={0} />
      </Empty>
    </Cell>
    <Cell label="no state yet — renders nothing">
      <Empty>
        <PortScanIcon host="192.168.1.42" port={80} />
      </Empty>
    </Cell>
  </Grid>
)

// How it actually reads in the app: trailing the host:port of each service
// being set up on a target device.
const Row: React.FC<{ state?: any; name: string; target: string }> = ({ state, name, target }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '96px 1fr 28px',
      alignItems: 'center',
      gap: 12,
      fontSize: 13,
      padding: '7px 0',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
    }}
  >
    <span style={{ fontWeight: 500 }}>{name}</span>
    <span style={{ fontFamily: 'Roboto Mono, monospace', opacity: 0.75 }}>{target}</span>
    <PortScanIcon state={state} host={target.split(':')[0]} port={Number(target.split(':')[1])} />
  </div>
)

export const ScanResults = () => (
  <div style={{ maxWidth: 420 }}>
    <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 6 }}>
      shop-floor-pi — services found
    </div>
    <Row name="SSH" target="127.0.0.1:22" state="REACHABLE" />
    <Row name="HTTP" target="127.0.0.1:80" state="REACHABLE" />
    <Row name="VNC" target="192.168.1.42:5900" state="UNREACHABLE" />
    <Row name="Modbus TCP" target="192.168.1.77:502" state="SCANNING" />
  </div>
)

// Inline in the setup form's Host / Port fields, which is where the glyph
// spends most of its life — it sits at the right edge of the port input.
export const InSetupForm = () => (
  <div style={{ display: 'grid', gap: 14, maxWidth: 380, fontSize: 13 }}>
    {[
      { label: 'Service host', value: '192.168.1.42', state: 'REACHABLE' },
      { label: 'Service port', value: '22', state: 'REACHABLE' },
      { label: 'Service port', value: '5900', state: 'UNREACHABLE' },
      { label: 'Service port', value: '33000', state: 'SCANNING' },
    ].map((f, i) => (
      <div key={i} style={{ display: 'grid', gap: 3 }}>
        <span style={{ fontSize: 11, opacity: 0.6 }}>{f.label}</span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0,0,0,0.2)',
            paddingBottom: 4,
          }}
        >
          <span style={{ fontFamily: 'Roboto Mono, monospace' }}>{f.value}</span>
          <PortScanIcon state={f.state as any} host="192.168.1.42" port={Number(f.value)} />
        </div>
      </div>
    ))}
  </div>
)
