import React from 'react'
import { GridList, GridListItem, Icon } from 'remoteit-desktop-frontend'

/**
 * GridList always renders GridListHeader, which calls react-redux `useDispatch`
 * to persist a column resize. The design-system entry has no redux Provider, so
 * without the shim below every cell threw and rendered blank.
 *
 * react-redux v9 keeps its context object in a globalThis registry keyed by
 * `React.createContext` (Symbol.for('react-redux-context')). The preview and the
 * shipped bundle share one React, so looking it up here yields the SAME context
 * the bundle's `useDispatch` reads — no second react-redux instance, and the
 * real header mounts. `dispatch` is a rematch-shaped object: the header calls
 * `const { ui } = useDispatch()` and then `ui.resizeColumn(...)` on drag.
 */
const ReactReduxContext: React.Context<unknown> | undefined = (
  globalThis as { [key: symbol]: Map<unknown, React.Context<unknown>> | undefined }
)[Symbol.for('react-redux-context')]?.get(React.createContext)

const store = {
  getState: () => ({}),
  subscribe: () => () => {},
  dispatch: Object.assign(() => {}, { ui: { resizeColumn: () => {} } }),
}

const WithStore: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  ReactReduxContext ? (
    <ReactReduxContext.Provider value={{ store }}>{children}</ReactReduxContext.Provider>
  ) : (
    <>{children}</>
  )

/**
 * The real app passes `Attribute` class instances. Attribute isn't exported from
 * the design-system entry, so these previews pass structurally-identical plain
 * objects — GridList/GridListHeaderTitle only read `id`, `label`, `align` and
 * call `width(columnWidths)`.
 */
const attr = (id: string, label: string, defaultWidth: number, align?: 'left' | 'right' | 'center') => ({
  id,
  label,
  align,
  defaultWidth,
  required: false,
  width: (columnWidths: { [key: string]: number }) => columnWidths[id] || defaultWidth,
})

const deviceName = attr('deviceName', 'Name', 240)

const columns = [
  attr('status', 'Status', 110),
  attr('platform', 'Platform', 150),
  attr('services', 'Services', 120, 'right'),
  attr('lastSeen', 'Last seen', 130),
]

const columnWidths: { [key: string]: number } = {}

/** Wide enough to hold the summed column widths — GridList sizes the grid to them. */
const Panel: React.FC<{ children?: React.ReactNode; width?: number }> = ({ children, width = 770 }) => (
  <div
    style={{
      width,
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.12)',
      borderRadius: 8,
      overflow: 'hidden',
    }}
  >
    <WithStore>{children}</WithStore>
  </div>
)

/**
 * `.attribute` is styled by GridList itself (flex, row height, ellipsis). A
 * right-aligned column needs the same 18px trailing gap GridListHeaderTitle
 * gives its header, otherwise the value butts straight against the next column.
 */
const Cell: React.FC<{ children?: React.ReactNode; align?: string }> = ({ children, align }) => (
  <div
    className="attribute"
    style={align === 'right' ? { justifyContent: 'flex-end', paddingRight: 18 } : undefined}
  >
    {children}
  </div>
)

const Status: React.FC<{ online?: boolean }> = ({ online }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <Icon name="circle" type="solid" size="xxs" color={online ? 'success' : 'gray'} />
    {online ? 'Online' : 'Offline'}
  </span>
)

type Row = {
  name: string
  online: boolean
  platform: string
  icon: string
  services: number
  seen: string
}

const DEVICES: Row[] = [
  { name: 'shop-floor-pi', online: true, platform: 'Raspberry Pi', icon: 'router', services: 5, seen: '2 min ago' },
  { name: 'warehouse-gateway', online: true, platform: 'Ubuntu 22.04', icon: 'server', services: 3, seen: '6 min ago' },
  { name: 'edge-node-04', online: false, platform: 'Debian 12', icon: 'microchip', services: 2, seen: '3 days ago' },
  { name: 'jamie-macbook', online: true, platform: 'macOS 14', icon: 'laptop', services: 1, seen: 'just now' },
]

/**
 * `mobile` drops the attribute columns, so the mobile rows fold the platform and
 * status into the sticky name slot — the inline-block keeps the second line
 * stacked under the name rather than wrapping back beneath the icon.
 */
const rows = (mobile?: boolean) =>
  DEVICES.map(d => (
    <GridListItem
      key={d.name}
      mobile={mobile}
      icon={<Icon name={d.icon} size="md" color={d.online ? 'primary' : 'gray'} fixedWidth />}
      required={
        <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
          <span style={{ fontWeight: 500 }}>{d.name}</span>
          {mobile && (
            <span style={{ display: 'block', fontSize: 12, opacity: 0.6 }}>
              {d.platform} · {d.online ? 'online' : 'offline'} · {d.services} services
            </span>
          )}
        </span>
      }
    >
      <Cell>
        <Status online={d.online} />
      </Cell>
      <Cell>{d.platform}</Cell>
      <Cell align="right">{d.services}</Cell>
      <Cell>{d.seen}</Cell>
    </GridListItem>
  ))

export const DeviceTable = () => (
  <Panel>
    <GridList attributes={columns} required={deviceName} columnWidths={columnWidths} headerIcon>
      {rows()}
    </GridList>
  </Panel>
)

export const Fetching = () => (
  <Panel>
    <GridList attributes={columns} required={deviceName} columnWidths={columnWidths} headerIcon fetching>
      {rows()}
    </GridList>
  </Panel>
)

export const CustomColumnWidths = () => (
  <Panel>
    <GridList
      attributes={columns}
      required={deviceName}
      columnWidths={{ deviceName: 280, status: 100, platform: 130, services: 110, lastSeen: 120 }}
      headerIcon
      rowHeight={52}
    >
      {rows()}
    </GridList>
  </Panel>
)

export const Mobile = () => (
  <Panel width={340}>
    <GridList attributes={columns} required={deviceName} columnWidths={columnWidths} mobile headerIcon>
      {rows(true)}
    </GridList>
  </Panel>
)
