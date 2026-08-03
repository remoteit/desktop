import React from 'react'
import { ConfirmIconButton } from 'remoteit-desktop-frontend'

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

export const Actions = () => (
  <Stack>
    <Spec caption="the guarded icon actions on a device row — title is the tooltip, icon comes from the curated FA packs">
      <ConfirmIconButton
        icon="trash"
        color="danger"
        title="Delete device"
        confirm
        confirmProps={{ title: 'Delete raspberrypi-lab?', action: 'Delete', color: 'error' }}
        onClick={() => {}}
      />
      <ConfirmIconButton
        icon="rotate"
        color="warning"
        title="Restart agent"
        confirm
        confirmProps={{ title: 'Restart the remote.it agent?', action: 'Restart' }}
        onClick={() => {}}
      />
      <ConfirmIconButton
        icon="user-slash"
        color="danger"
        title="Remove share"
        confirm
        confirmProps={{ title: 'Remove sam@remote.it?', action: 'Remove', color: 'error' }}
        onClick={() => {}}
      />
      <ConfirmIconButton
        icon="power-off"
        color="grayDarker"
        title="Disable service"
        confirm
        confirmProps={{ title: 'Disable SSH on raspberrypi-lab?', action: 'Disable' }}
        onClick={() => {}}
      />
    </Spec>
  </Stack>
)

export const Variants = () => (
  <Stack>
    <Spec caption="variant unset (default) — the icon carries the color, no chrome">
      <ConfirmIconButton icon="trash" color="danger" title="Delete device" confirm onClick={() => {}} />
      <ConfirmIconButton icon="share-nodes" color="primary" title="Share device" confirm onClick={() => {}} />
      <ConfirmIconButton icon="ban" color="grayDarker" title="Revoke access key" confirm onClick={() => {}} />
    </Spec>
    <Spec caption="variant=&quot;contained&quot; — filled circle in the palette color, alwaysWhite glyph">
      <ConfirmIconButton variant="contained" icon="trash" color="danger" title="Delete device" confirm onClick={() => {}} />
      <ConfirmIconButton variant="contained" icon="play" color="primary" title="Connect" confirm onClick={() => {}} />
      <ConfirmIconButton variant="contained" icon="check" color="success" title="Approve" confirm onClick={() => {}} />
    </Spec>
    <Spec caption="variant=&quot;outlined&quot; — note the source builds the border string from a palette KEY, so no visible border resolves">
      <ConfirmIconButton variant="outlined" icon="trash" color="danger" title="Delete device" confirm onClick={() => {}} />
      <ConfirmIconButton variant="outlined" icon="rotate" color="primary" title="Restart" confirm onClick={() => {}} />
    </Spec>
  </Stack>
)

export const Sizes = () => (
  <Stack>
    <Spec caption="size — the Icon scale (xs / sm / base / md / lg / xl)">
      <ConfirmIconButton size="xs" icon="trash" color="danger" title="Delete" confirm onClick={() => {}} />
      <ConfirmIconButton size="sm" icon="trash" color="danger" title="Delete" confirm onClick={() => {}} />
      <ConfirmIconButton size="base" icon="trash" color="danger" title="Delete" confirm onClick={() => {}} />
      <ConfirmIconButton size="md" icon="trash" color="danger" title="Delete" confirm onClick={() => {}} />
      <ConfirmIconButton size="lg" icon="trash" color="danger" title="Delete" confirm onClick={() => {}} />
      <ConfirmIconButton size="xl" icon="trash" color="danger" title="Delete" confirm onClick={() => {}} />
    </Spec>
    <Spec caption="buttonBaseSize — the MUI hit-target/padding around the glyph (small / medium / large)">
      <ConfirmIconButton
        buttonBaseSize="small"
        variant="contained"
        icon="trash"
        color="danger"
        title="Delete"
        confirm
        onClick={() => {}}
      />
      <ConfirmIconButton
        buttonBaseSize="medium"
        variant="contained"
        icon="trash"
        color="danger"
        title="Delete"
        confirm
        onClick={() => {}}
      />
      <ConfirmIconButton
        buttonBaseSize="large"
        variant="contained"
        icon="trash"
        color="danger"
        title="Delete"
        confirm
        onClick={() => {}}
      />
    </Spec>
  </Stack>
)

export const WithLabel = () => (
  <Stack>
    <Spec caption="children render beside the glyph; iconInlineLeft adds the gap. forceTitle keeps the tooltip even when a label is shown">
      <ConfirmIconButton icon="trash" color="danger" title="Delete device" forceTitle iconInlineLeft confirm onClick={() => {}}>
        <span style={{ fontSize: 13 }}>Delete device</span>
      </ConfirmIconButton>
      <ConfirmIconButton icon="rotate" color="primary" title="Restart agent" forceTitle iconInlineLeft confirm onClick={() => {}}>
        <span style={{ fontSize: 13 }}>Restart agent</span>
      </ConfirmIconButton>
    </Spec>
  </Stack>
)

export const States = () => (
  <Stack>
    <Spec caption="enabled / disabled / disabled+hideDisableFade — disabled normally drops to 0.5 opacity and loses its tooltip">
      <ConfirmIconButton icon="trash" color="danger" title="Delete device" confirm onClick={() => {}} />
      <ConfirmIconButton icon="trash" color="danger" title="Delete device" confirm disabled onClick={() => {}} />
      <ConfirmIconButton
        icon="trash"
        color="danger"
        title="Delete device"
        confirm
        disabled
        hideDisableFade
        onClick={() => {}}
      />
    </Spec>
    <Spec caption="loading — the icon is force-swapped for a spinning spinner-third regardless of the icon prop">
      <ConfirmIconButton icon="trash" color="danger" title="Deleting…" loading onClick={() => {}} />
      <ConfirmIconButton variant="contained" icon="play" color="primary" title="Connecting…" loading onClick={() => {}} />
    </Spec>
  </Stack>
)
