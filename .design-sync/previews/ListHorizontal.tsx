import React from 'react'
import { ListHorizontal, ListItemButton, Icon } from 'remoteit-desktop-frontend'

/**
 * ListHorizontal pins every tab to a fixed 100px, and ListItemButton renders
 * `value` as a 12px monospace <pre> with `overflow-wrap: break-word` — so
 * anything past ~8 characters splits mid-word ("Configur/e"). `size="small"` is
 * tighter still: the icon reserves 60px of the 100, leaving ~22px for text.
 * Cells that carry longer real values widen the tab through the component's own
 * `sx` prop (merged last, so it wins); `Tabs` keeps the default width to show
 * the component's native sizing.
 */
const wide = (width: number) => ({ '& .MuiListItemButton-root': { width, minWidth: width } })

const Panel: React.FC<{ children?: React.ReactNode; width?: number }> = ({ children, width = 620 }) => (
  <div
    style={{
      width,
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.12)',
      borderRadius: 8,
      paddingBottom: 8,
    }}
  >
    {children}
  </div>
)

export const Tabs = () => (
  <Panel>
    <ListHorizontal>
      <ListItemButton icon="circle-info" iconColor="primary" title="Device details" value="Details" onClick={() => {}} />
      <ListItemButton icon="users" iconColor="grayDarker" title="Users with access" value="Users" onClick={() => {}} />
      <ListItemButton icon="file-alt" iconColor="grayDarker" title="Device logs" value="Logs" onClick={() => {}} />
      <ListItemButton icon="chart-column" iconColor="grayDarker" title="Connection usage" value="Usage" onClick={() => {}} />
      <ListItemButton icon="bell" iconColor="grayDarker" title="Device alerts" value="Alerts" onClick={() => {}} />
    </ListHorizontal>
  </Panel>
)

export const SmallSize = () => (
  <Panel>
    <ListHorizontal size="small" sx={wide(140)}>
      <ListItemButton icon="terminal" iconColor="primary" title="Open an SSH session" value="SSH" onClick={() => {}} />
      <ListItemButton icon="desktop" iconColor="primary" title="Open a VNC session" value="VNC" onClick={() => {}} />
      <ListItemButton icon="globe" iconColor="primary" title="Open in browser" value="HTTP" onClick={() => {}} />
      <ListItemButton icon="share-nodes" iconColor="primary" title="MQTT broker" value="MQTT" onClick={() => {}} />
    </ListHorizontal>
  </Panel>
)

export const DeviceStats = () => (
  <Panel width={740}>
    <ListHorizontal sx={wide(140)}>
      <ListItemButton icon="microchip" iconColor="grayDarker" title="Target platform" label="Platform" value="Raspberry Pi" onClick={() => {}} />
      <ListItemButton icon="ethernet" iconColor="grayDarker" title="Internal address" label="Address" value="192.168.1.24" onClick={() => {}} />
      <ListItemButton icon="wave-pulse" iconColor="success" title="Device status" label="Status" value="Online" onClick={() => {}} />
      <ListItemButton icon="clock" iconColor="grayDarker" title="Last reported" label="Last seen" value="2 min ago" onClick={() => {}} />
      <ListItemButton icon="user" iconColor="grayDarker" title="Device owner" label="Owner" value="jamie" onClick={() => {}} />
    </ListHorizontal>
  </Panel>
)

export const WithCustomIcons = () => (
  <Panel>
    <ListHorizontal sx={wide(130)}>
      <ListItemButton
        icon={<Icon name="raspberry-pi" type="brands" size="xl" color="primary" />}
        title="Raspberry Pi targets"
        value="Raspberry Pi"
        onClick={() => {}}
      />
      <ListItemButton
        icon={<Icon name="ubuntu" type="brands" size="xl" color="primary" />}
        title="Ubuntu targets"
        value="Ubuntu"
        onClick={() => {}}
      />
      <ListItemButton
        icon={<Icon name="docker" type="brands" size="xl" color="primary" />}
        title="Docker targets"
        value="Docker"
        onClick={() => {}}
      />
      <ListItemButton
        icon={<Icon name="apple" type="brands" size="xl" color="primary" />}
        title="macOS targets"
        value="macOS"
        onClick={() => {}}
      />
    </ListHorizontal>
  </Panel>
)
