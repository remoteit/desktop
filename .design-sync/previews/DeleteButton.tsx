import React from 'react'
import { DeleteButton } from 'remoteit-desktop-frontend'

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

/* A plain <ul> — DeleteButton's menuItem form renders an <li>, and importing
   MUI's <List> here would bundle a second MUI instance with a different theme
   context. */
const Menu: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 280 }}>{children}</ul>
)

/* A detail-page header stand-in, so the button is shown where the product puts
   it: at the trailing edge of a device or service header. */
const Header: React.FC<{ name: string; meta: string; children?: React.ReactNode }> = ({ name, meta, children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '4px 8px 4px 14px',
      width: 380,
      borderRadius: 4,
      background: 'rgba(0,0,0,0.04)',
      fontFamily: 'system-ui',
    }}
  >
    <div style={{ display: 'grid' }}>
      <span style={{ fontSize: 13 }}>{name}</span>
      <span style={{ fontSize: 11, opacity: 0.55 }}>{meta}</span>
    </div>
    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>{children}</span>
  </div>
)

export const Default = () => (
  <Stack>
    <Spec caption="the resting icon button — title is the tooltip AND the confirm dialog's action verb. It only opens the Confirm dialog on click, so this is the whole resting appearance">
      <DeleteButton title="Delete device" onDelete={() => {}} />
      <DeleteButton title="Remove service" onDelete={() => {}} />
      <DeleteButton title="Leave organization" onDelete={() => {}} />
    </Spec>
    <Spec caption="where it ships — the trailing action of a device / service detail header">
      <div style={{ display: 'grid', gap: 6 }}>
        <Header name="raspberrypi-lab" meta="4 services · online">
          <DeleteButton title="Delete device" warning="raspberrypi-lab and its 4 services will be removed." onDelete={() => {}} />
        </Header>
        <Header name="SSH — raspberrypi-lab" meta="port 22 · connected">
          <DeleteButton title="Remove service" onDelete={() => {}} />
        </Header>
      </div>
    </Spec>
  </Stack>
)

export const Icons = () => (
  <Stack>
    <Spec caption="icon overrides the default `trash` — same confirm flow, different affordance">
      <DeleteButton title="Delete device" onDelete={() => {}} />
      <DeleteButton title="Remove share" icon="user-slash" onDelete={() => {}} />
      <DeleteButton title="Revoke access key" icon="ban" onDelete={() => {}} />
      <DeleteButton title="Close connection" icon="xmark" onDelete={() => {}} />
    </Spec>
  </Stack>
)

export const States = () => (
  <Stack>
    <Spec caption="enabled / disabled — disabled is how a non-owner sees another member's device">
      <DeleteButton title="Delete device" onDelete={() => {}} />
      <DeleteButton title="Delete device" disabled onDelete={() => {}} />
    </Spec>
    <Spec caption="destroying — the icon swaps to a spinning solid spinner-third tinted danger while the delete is in flight">
      <DeleteButton title="Delete device" destroying onDelete={() => {}} />
      <DeleteButton title="Remove service" destroying onDelete={() => {}} />
    </Spec>
  </Stack>
)

export const InMenu = () => (
  <Stack>
    <Spec caption="menuItem — renders a dense MenuItem with icon + label, for the device row overflow menu">
      <Menu>
        <DeleteButton
          menuItem
          title="Delete device"
          warning="Deleting this device removes all of its services and connections."
          onDelete={() => {}}
        />
        <DeleteButton menuItem title="Remove service" onDelete={() => {}} />
        <DeleteButton menuItem title="Delete device" disabled onDelete={() => {}} />
      </Menu>
    </Spec>
  </Stack>
)

export const WithWarning = () => (
  <Stack>
    <Spec caption="warning is the body of the confirm dialog — it only appears after a click, so the resting state is identical">
      <DeleteButton
        title="Delete device"
        warning="raspberrypi-lab and its 4 services will be permanently removed. This cannot be undone."
        onDelete={() => {}}
        onCancel={() => {}}
      />
      <DeleteButton
        title="Remove share"
        warning="sam@remote.it will immediately lose access to all shared services."
        icon="user-slash"
        onDelete={() => {}}
        onCancel={() => {}}
      />
    </Spec>
  </Stack>
)
