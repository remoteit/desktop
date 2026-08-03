import React from 'react'
import { ListItemButton, Icon } from 'remoteit-desktop-frontend'

/* ListItemButton renders a list row — wrap it in a plain <ul>. Importing MUI's
   <List> here would pull a second MUI instance into the preview bundle and the
   rows would lose the app theme. */
const List: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 520 }}>{children}</ul>
)

const Spec: React.FC<{ caption: string; children?: React.ReactNode }> = ({ caption, children }) => (
  <div style={{ display: 'grid', gap: 6 }}>
    <List>{children}</List>
    <span style={{ fontSize: 10, opacity: 0.6, fontFamily: 'system-ui', letterSpacing: 0.2 }}>{caption}</span>
  </div>
)

const Stack: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gap: 18, maxWidth: 560 }}>{children}</div>
)

export const Default = () => (
  <Stack>
    <Spec caption="label is the shrunk field caption, value is the copyable monospace body, title is only the tooltip">
      <ListItemButton
        icon="globe"
        label="Public address"
        value="raspberrypi-lab.at.remote.it"
        title="Copy the public address"
        onClick={() => {}}
      />
      <ListItemButton
        icon="ethernet"
        label="Local endpoint"
        value="127.0.0.1:33000"
        title="Copy the local endpoint"
        onClick={() => {}}
      />
      <ListItemButton
        icon="terminal"
        label="Launch command"
        value="ssh pi@127.0.0.1 -p 33000"
        title="Copy the launch command"
        onClick={() => {}}
      />
    </Spec>
  </Stack>
)

export const IconColors = () => (
  <Stack>
    <Spec caption="iconColor pulls straight from the app palette — the 60px icon gutter is fixed by the component">
      <ListItemButton
        icon="circle-check"
        iconColor="success"
        label="Connection"
        value="Connected — peer to peer"
        title="Connection state"
        onClick={() => {}}
      />
      <ListItemButton
        icon="triangle-exclamation"
        iconColor="warning"
        label="Latency"
        value="284 ms — routed through a proxy"
        title="Connection quality"
        onClick={() => {}}
      />
      <ListItemButton
        icon="circle-exclamation"
        iconColor="danger"
        label="Last error"
        value="Connection refused on port 22"
        title="Last reported error"
        onClick={() => {}}
      />
      <ListItemButton
        icon="key"
        iconColor="primary"
        label="Device key"
        value="80:00:00:00:01:0A:BC:DE"
        title="Copy the device key"
        onClick={() => {}}
      />
    </Spec>
  </Stack>
)

export const Density = () => (
  <Stack>
    <Spec caption="default padding (sm) — the roomy form used on the service detail page">
      <ListItemButton icon="server" label="Host" value="192.168.1.24" title="Service host" onClick={() => {}} />
    </Spec>
    <Spec caption="dense — tighter padding and a left inset, used inside the connection drawer">
      <ListItemButton dense icon="server" label="Host" value="192.168.1.24" title="Service host" onClick={() => {}} />
      <ListItemButton dense icon="plug" label="Port" value="22" title="Service port" onClick={() => {}} />
    </Spec>
    <Spec caption="icon={null} — no glyph, the text shifts into the gutter">
      <ListItemButton icon={null} label="Service name" value="SSH" title="Service name" onClick={() => {}} />
    </Spec>
  </Stack>
)

export const Backgrounds = () => (
  <Stack>
    <Spec caption="showBackground paints the screen color; gutterBottom adds the sm gap between stacked rows">
      <ListItemButton
        showBackground
        gutterBottom
        fullWidth
        icon="globe"
        label="Public address"
        value="raspberrypi-lab.at.remote.it"
        title="Copy the public address"
        onClick={() => {}}
      />
      <ListItemButton
        showBackground
        fullWidth
        icon="ethernet"
        label="Local endpoint"
        value="127.0.0.1:33000"
        title="Copy the local endpoint"
        onClick={() => {}}
      />
    </Spec>
    <Spec caption="showBackground + invertBackground — the 70% white fill used over a tinted panel">
      <div style={{ background: '#0096e7', padding: 12, borderRadius: 6 }}>
        <ListItemButton
          showBackground
          invertBackground
          fullWidth
          icon="link"
          label="Persistent public URL"
          value="https://lab.at.remote.it"
          title="Copy the public URL"
          onClick={() => {}}
        />
      </div>
    </Spec>
  </Stack>
)

export const WithAction = () => (
  <Stack>
    <Spec caption="action renders in the row's secondary slot — normally the copy affordance">
      <ListItemButton
        showBackground
        gutterBottom
        fullWidth
        icon="globe"
        label="Public address"
        value="raspberrypi-lab.at.remote.it"
        title="Copy the public address"
        action={<Icon name="copy" size="md" color="grayDark" />}
        onClick={() => {}}
      />
      <ListItemButton
        showBackground
        fullWidth
        icon="qrcode"
        label="Enrollment key"
        value="A1B2-C3D4-E5F6"
        title="Show the enrollment QR code"
        action={<Icon name="chevron-right" size="md" color="grayDark" />}
        onClick={() => {}}
      />
    </Spec>
  </Stack>
)
