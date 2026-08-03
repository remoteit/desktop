import React from 'react'
import { DynamicButton } from 'remoteit-desktop-frontend'

/* Layout helpers are plain HTML + inline styles on purpose: importing anything
   from @mui/material here would pull a SECOND MUI instance into the preview
   bundle, whose ThemeProvider context differs from the DS bundle's — the
   components would then render unthemed. */
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

export const Sizes = () => (
  <Stack>
    <Spec caption="size=&quot;chip&quot; — 20px tall, used for inline status actions in a device row">
      <DynamicButton size="chip" title="Connect" color="primary" onClick={() => {}} />
      <DynamicButton size="chip" title="Connected" color="success" onClick={() => {}} />
      <DynamicButton size="chip" title="Offline" color="gray" onClick={() => {}} />
    </Spec>
    <Spec caption="size=&quot;small&quot; / &quot;medium&quot; / &quot;large&quot; — icon sits inline-left of the title">
      <DynamicButton size="small" title="Connect" icon="play" color="primary" onClick={() => {}} />
      <DynamicButton size="medium" title="Add service" icon="plus" color="primary" onClick={() => {}} />
      <DynamicButton size="large" title="Restart agent" icon="rotate" color="primary" onClick={() => {}} />
    </Spec>
    <Spec caption="size=&quot;icon&quot; (the default) — bare IconButton, the title becomes its tooltip">
      <DynamicButton size="icon" title="Connect" icon="play" color="primary" onClick={() => {}} />
      <DynamicButton size="icon" title="Copy address" icon="copy" color="grayDarker" onClick={() => {}} />
      <DynamicButton size="icon" title="Remove" icon="trash" color="danger" onClick={() => {}} />
    </Spec>
  </Stack>
)

export const Variants = () => (
  <Stack>
    <Spec caption="variant=&quot;contained&quot; (default) — solid palette fill, alwaysWhite label">
      <DynamicButton size="medium" variant="contained" title="Connect" icon="play" color="primary" onClick={() => {}} />
      <DynamicButton
        size="medium"
        variant="contained"
        title="Share device"
        icon="share-nodes"
        color="success"
        onClick={() => {}}
      />
    </Spec>
    <Spec caption="variant=&quot;text&quot; — the color becomes the label and a 10% alpha wash becomes the fill">
      <DynamicButton size="medium" variant="text" title="Connect" icon="play" color="primary" onClick={() => {}} />
      <DynamicButton size="medium" variant="text" title="Remove device" icon="trash" color="danger" onClick={() => {}} />
    </Spec>
    <Spec caption="variant=&quot;outlined&quot; — only `text` gets the tint treatment, so a color still paints a solid fill under the outline">
      <DynamicButton size="medium" variant="outlined" title="Scan network" icon="radar" color="primary" onClick={() => {}} />
      <DynamicButton size="medium" variant="outlined" title="Details" icon="circle-info" color="grayDarker" onClick={() => {}} />
    </Spec>
    <Spec caption="the low-emphasis pair used beside a primary action — outlined grayDarker, then contained gray. An outlined button must always be given a color: with none the label stays alwaysWhite on a transparent fill and disappears">
      <DynamicButton size="medium" variant="outlined" title="Cancel" color="grayDarker" onClick={() => {}} />
      <DynamicButton size="medium" variant="contained" title="Cancel" color="gray" onClick={() => {}} />
    </Spec>
  </Stack>
)

export const Colors = () => (
  <Stack>
    <Spec caption="color maps straight onto the app palette — primary is the Remote.It brand blue #0096e7">
      <DynamicButton size="medium" title="Connect" color="primary" icon="play" onClick={() => {}} />
      <DynamicButton size="medium" title="Online" color="success" icon="circle-check" onClick={() => {}} />
      <DynamicButton size="medium" title="Expiring" color="warning" icon="clock" onClick={() => {}} />
    </Spec>
    <Spec caption="danger / gray / grayDarker — destructive and low-emphasis actions">
      <DynamicButton size="medium" title="Delete device" color="danger" icon="trash" onClick={() => {}} />
      <DynamicButton size="medium" title="Disabled service" color="gray" icon="ban" onClick={() => {}} />
      <DynamicButton size="medium" title="Details" color="grayDarker" icon="circle-info" onClick={() => {}} />
    </Spec>
  </Stack>
)

export const States = () => (
  <Stack>
    <Spec caption="default vs disabled — disabled swaps the fill for grayLight and freezes the hover">
      <DynamicButton size="medium" title="Register device" icon="plus" color="primary" onClick={() => {}} />
      <DynamicButton size="medium" title="Register device" icon="plus" color="primary" disabled onClick={() => {}} />
    </Spec>
    <Spec caption="loading — size=&quot;small&quot; force-swaps the icon for a solid spinner-third; other sizes just spin the given icon">
      <DynamicButton size="small" title="Connecting…" icon="play" color="primary" loading onClick={() => {}} />
      <DynamicButton size="medium" title="Restarting agent" icon="rotate" color="primary" loading onClick={() => {}} />
      <DynamicButton size="icon" title="Refreshing" icon="rotate" color="primary" loading onClick={() => {}} />
    </Spec>
    <Spec caption="chip size also honours disabled — the offline state of a service chip">
      <DynamicButton size="chip" title="Connect" color="primary" onClick={() => {}} />
      <DynamicButton size="chip" title="Connect" color="primary" disabled onClick={() => {}} />
    </Spec>
  </Stack>
)

export const ProductUsage = () => (
  <Stack>
    <Spec caption="the service row action cluster — connect, copy the connection address, open the launch target">
      <DynamicButton size="chip" title="Connect" color="primary" onClick={() => {}} />
      <DynamicButton size="icon" title="Copy address" icon="copy" color="grayDarker" onClick={() => {}} />
      <DynamicButton size="icon" title="Launch" icon="arrow-right-from-bracket" color="grayDarker" onClick={() => {}} />
      <DynamicButton size="icon" title="Service settings" icon="gear" color="grayDarker" onClick={() => {}} />
    </Spec>
    <Spec caption="a device page footer — the primary action plus a destructive secondary">
      <DynamicButton size="medium" title="Add service" icon="plus" color="primary" onClick={() => {}} />
      <DynamicButton size="medium" variant="text" title="Remove device" icon="trash" color="danger" onClick={() => {}} />
    </Spec>
  </Stack>
)
