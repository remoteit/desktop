import React from 'react'
import { ErrorButton } from 'remoteit-desktop-frontend'

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
)

const Stack: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gap: 18, maxWidth: 620 }}>{children}</div>
)

const Spec: React.FC<{ caption: string; children?: React.ReactNode }> = ({ caption, children }) => (
  <div style={{ display: 'grid', gap: 6 }}>
    <Row>{children}</Row>
    <span style={{ fontSize: 10, opacity: 0.6, fontFamily: 'system-ui', letterSpacing: 0.2 }}>{caption}</span>
  </div>
)

/* A connection row stand-in, so the button is shown where the product puts it:
   inline-left of the connection name in the Networks list. */
const ConnectionRow: React.FC<{ name: string; endpoint: string; children?: React.ReactNode }> = ({
  name,
  endpoint,
  children,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '6px 10px',
      minWidth: 300,
      borderRadius: 4,
      background: 'rgba(0,0,0,0.04)',
      fontFamily: 'system-ui',
    }}
  >
    {children}
    <span style={{ fontSize: 13 }}>{name}</span>
    <span style={{ fontSize: 12, opacity: 0.55, marginLeft: 'auto', fontFamily: 'ui-monospace, monospace' }}>
      {endpoint}
    </span>
  </div>
)

/* ErrorButton reads connection.error.message and renders nothing without one —
   these are the minimal IConnection shapes it actually touches. */
const refused: any = {
  id: '80:00:00:00:01:0a:bc:de',
  name: 'SSH — raspberrypi-lab',
  error: { message: 'Connection refused on port 22' },
}
const timedOut: any = {
  id: '80:00:00:00:01:0a:bc:df',
  name: 'HTTP — nginx-edge',
  error: { message: 'Timed out waiting for the remote.it agent to respond' },
}
const inUse: any = {
  id: '80:00:00:00:01:0a:bc:e0',
  name: 'VNC — workshop-nuc',
  error: { message: 'Local port 33002 is already in use' },
}
const healthy: any = { id: '80:00:00:00:01:0a:bc:e1', name: 'SSH — build-agent-01' }

export const Collapsed = () => (
  <Stack>
    <Spec caption="visible={false} — the resting state; a danger exclamation-triangle whose tooltip reads “Show error”">
      <ErrorButton connection={refused} visible={false} onClick={() => {}} />
      <ErrorButton connection={timedOut} visible={false} onClick={() => {}} />
      <ErrorButton connection={inUse} visible={false} onClick={() => {}} />
    </Spec>
  </Stack>
)

export const Expanded = () => (
  <Stack>
    <Spec caption="visible={true} — identical glyph, the tooltip flips to “Hide error”; only the tooltip encodes the toggle">
      <ErrorButton connection={refused} visible onClick={() => {}} />
      <ErrorButton connection={timedOut} visible onClick={() => {}} />
      <ErrorButton connection={inUse} visible onClick={() => {}} />
    </Spec>
  </Stack>
)

export const InConnectionRow = () => (
  <Stack>
    <Spec caption="how it ships — inlineLeft of the connection name in the Networks list, one row per failing connection">
      <div style={{ display: 'grid', gap: 6 }}>
        <ConnectionRow name="SSH — raspberrypi-lab" endpoint="127.0.0.1:33000">
          <ErrorButton connection={refused} visible={false} onClick={() => {}} />
        </ConnectionRow>
        <ConnectionRow name="HTTP — nginx-edge" endpoint="127.0.0.1:33001">
          <ErrorButton connection={timedOut} visible={false} onClick={() => {}} />
        </ConnectionRow>
        <ConnectionRow name="VNC — workshop-nuc" endpoint="127.0.0.1:33002">
          <ErrorButton connection={inUse} visible={false} onClick={() => {}} />
        </ConnectionRow>
      </div>
    </Spec>
  </Stack>
)

export const NoErrorRendersNothing = () => (
  <Stack>
    <Spec caption="a connection with no error.message (or no connection at all) renders null — the healthy row below simply has no glyph">
      <div style={{ display: 'grid', gap: 6 }}>
        <ConnectionRow name="SSH — raspberrypi-lab" endpoint="127.0.0.1:33000">
          <ErrorButton connection={refused} visible={false} onClick={() => {}} />
        </ConnectionRow>
        <ConnectionRow name="SSH — build-agent-01" endpoint="127.0.0.1:33003">
          <ErrorButton connection={healthy} visible={false} onClick={() => {}} />
        </ConnectionRow>
        <ConnectionRow name="SSH — office-gateway" endpoint="127.0.0.1:33004">
          <ErrorButton visible={false} onClick={() => {}} />
        </ConnectionRow>
      </div>
    </Spec>
  </Stack>
)
