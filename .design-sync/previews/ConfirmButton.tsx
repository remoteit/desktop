import React from 'react'
import { ConfirmButton } from 'remoteit-desktop-frontend'

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

export const Confirming = () => (
  <Stack>
    <Spec caption="confirm — identical resting state to DynamicButton; the Confirm dialog only mounts open after a click, so a screenshot always shows the button">
      <ConfirmButton
        size="medium"
        title="Delete device"
        icon="trash"
        color="danger"
        confirm
        confirmProps={{
          title: 'Delete raspberrypi-lab?',
          action: 'Delete',
          color: 'error',
          children: 'The device and all 4 of its services will be permanently removed.',
        }}
        onClick={() => {}}
      />
      <ConfirmButton
        size="medium"
        title="Restart agent"
        icon="rotate"
        color="warning"
        confirm
        confirmProps={{
          title: 'Restart the remote.it agent?',
          action: 'Restart',
          children: 'Active connections to this device will drop for a few seconds.',
        }}
        onClick={() => {}}
      />
    </Spec>
  </Stack>
)

export const ConfirmVsDirect = () => (
  <Stack>
    <Spec caption="confirm={true} routes the click through the dialog; without it the onClick fires immediately — visually indistinguishable, which is the point">
      <ConfirmButton
        size="medium"
        title="Leave organization"
        icon="arrow-right-from-bracket"
        color="danger"
        confirm
        confirmProps={{ title: 'Leave Acme Robotics?', action: 'Leave' }}
        onClick={() => {}}
      />
      <ConfirmButton size="medium" title="Refresh" icon="rotate" color="primary" onClick={() => {}} />
    </Spec>
  </Stack>
)

export const Sizes = () => (
  <Stack>
    <Spec caption="inherits every DynamicButton size — chip / small / medium / large">
      <ConfirmButton size="chip" title="Disconnect" color="danger" confirm onClick={() => {}} />
      <ConfirmButton size="small" title="Disconnect" icon="stop" color="danger" confirm onClick={() => {}} />
      <ConfirmButton size="medium" title="Disconnect" icon="stop" color="danger" confirm onClick={() => {}} />
      <ConfirmButton size="large" title="Disconnect" icon="stop" color="danger" confirm onClick={() => {}} />
    </Spec>
    <Spec caption="size=&quot;icon&quot; — the confirm-guarded icon button used in a device row">
      <ConfirmButton size="icon" title="Delete device" icon="trash" color="danger" confirm onClick={() => {}} />
      <ConfirmButton size="icon" title="Revoke key" icon="ban" color="danger" confirm onClick={() => {}} />
      <ConfirmButton size="icon" title="Restart agent" icon="rotate" color="warning" confirm onClick={() => {}} />
    </Spec>
  </Stack>
)

export const Variants = () => (
  <Stack>
    <Spec caption="contained / text — the two variants the button styles; a colorless variant=&quot;outlined&quot; is unsupported (no background, so the always-white label vanishes), so a neutral action uses text + color=&quot;gray&quot;">
      <ConfirmButton
        size="medium"
        variant="contained"
        title="Delete device"
        icon="trash"
        color="danger"
        confirm
        onClick={() => {}}
      />
      <ConfirmButton
        size="medium"
        variant="text"
        title="Delete device"
        icon="trash"
        color="danger"
        confirm
        onClick={() => {}}
      />
      <ConfirmButton size="medium" variant="text" color="gray" title="Cancel" onClick={() => {}} />
    </Spec>
  </Stack>
)

export const States = () => (
  <Stack>
    <Spec caption="disabled — greyed out, the dialog can never open">
      <ConfirmButton size="medium" title="Delete device" icon="trash" color="danger" confirm onClick={() => {}} />
      <ConfirmButton
        size="medium"
        title="Delete device"
        icon="trash"
        color="danger"
        confirm
        disabled
        onClick={() => {}}
      />
    </Spec>
    <Spec caption="loading — the confirm was accepted and the mutation is in flight">
      <ConfirmButton size="small" title="Deleting…" icon="trash" color="danger" loading onClick={() => {}} />
      <ConfirmButton size="medium" title="Restarting agent" icon="rotate" color="warning" loading onClick={() => {}} />
    </Spec>
  </Stack>
)
