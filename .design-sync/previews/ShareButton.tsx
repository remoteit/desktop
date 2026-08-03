import React from 'react'
import { ShareButton } from 'remoteit-desktop-frontend'

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

/* ShareButton falls back to icon="share", which Icon rewrites to the FA glyph
   `arrow-up-from-bracket` — that glyph is not in the design-sync curated packs,
   so an icon-less ShareButton renders an empty hit target here. Every cell
   below therefore names its glyph explicitly. */

export const Default = () => (
  <Stack>
    <Spec caption="the bare button — the glyph carries the color, title becomes the tooltip">
      <ShareButton icon="share-nodes" title="Share device" onClick={() => {}} />
      <ShareButton icon="share-nodes" title="Share device" color="primary" onClick={() => {}} />
      <ShareButton icon="share-nodes" title="Share device" color="grayDarker" onClick={() => {}} />
    </Spec>
    <Spec caption="icon selects the glyph for the other sharing surfaces">
      <ShareButton icon="share-nodes" title="Share service" color="primary" onClick={() => {}} />
      <ShareButton icon="user-plus" title="Add a user" color="primary" onClick={() => {}} />
      <ShareButton icon="link" title="Copy share link" color="primary" onClick={() => {}} />
      <ShareButton icon="envelope" title="Email an invite" color="primary" onClick={() => {}} />
    </Spec>
  </Stack>
)

export const Variants = () => (
  <Stack>
    <Spec caption="variant unset — the glyph itself carries the palette color">
      <ShareButton icon="share-nodes" title="Share device" color="primary" onClick={() => {}} />
      <ShareButton icon="share-nodes" title="Share device" color="success" onClick={() => {}} />
      <ShareButton icon="share-nodes" title="Share device" color="grayDarker" onClick={() => {}} />
    </Spec>
    <Spec caption="variant=&quot;contained&quot; — solid palette disc with an alwaysWhite glyph (the brand blue is #0096e7)">
      <ShareButton variant="contained" icon="share-nodes" title="Share device" color="primary" onClick={() => {}} />
      <ShareButton variant="contained" icon="user-plus" title="Add a user" color="success" onClick={() => {}} />
      <ShareButton variant="contained" icon="link" title="Copy share link" color="grayDarker" onClick={() => {}} />
    </Spec>
    <Spec caption="variant=&quot;outlined&quot; — note: the source builds the border from a palette KEY string, so no border actually resolves">
      <ShareButton variant="outlined" icon="share-nodes" title="Share device" color="primary" onClick={() => {}} />
      <ShareButton variant="outlined" icon="user-plus" title="Add a user" color="primary" onClick={() => {}} />
    </Spec>
  </Stack>
)

export const Sizes = () => (
  <Stack>
    <Spec caption="size — the Icon scale (xs / sm / base / md / lg / xl)">
      <ShareButton size="xs" icon="share-nodes" title="Share" color="primary" onClick={() => {}} />
      <ShareButton size="sm" icon="share-nodes" title="Share" color="primary" onClick={() => {}} />
      <ShareButton size="base" icon="share-nodes" title="Share" color="primary" onClick={() => {}} />
      <ShareButton size="md" icon="share-nodes" title="Share" color="primary" onClick={() => {}} />
      <ShareButton size="lg" icon="share-nodes" title="Share" color="primary" onClick={() => {}} />
      <ShareButton size="xl" icon="share-nodes" title="Share" color="primary" onClick={() => {}} />
    </Spec>
    <Spec caption="buttonBaseSize — the MUI padding/hit target around the glyph (small / medium / large)">
      <ShareButton
        variant="contained"
        buttonBaseSize="small"
        icon="share-nodes"
        title="Share"
        color="primary"
        onClick={() => {}}
      />
      <ShareButton
        variant="contained"
        buttonBaseSize="medium"
        icon="share-nodes"
        title="Share"
        color="primary"
        onClick={() => {}}
      />
      <ShareButton
        variant="contained"
        buttonBaseSize="large"
        icon="share-nodes"
        title="Share"
        color="primary"
        onClick={() => {}}
      />
    </Spec>
  </Stack>
)

export const WithLabel = () => (
  <Stack>
    <Spec caption="children sit beside the glyph; iconInlineLeft adds the gap and forceTitle keeps the tooltip">
      <ShareButton icon="share-nodes" title="Share device" forceTitle iconInlineLeft color="primary" onClick={() => {}}>
        <span style={{ fontSize: 13 }}>Share</span>
      </ShareButton>
      <ShareButton icon="user-plus" title="Add a user" forceTitle iconInlineLeft color="primary" onClick={() => {}}>
        <span style={{ fontSize: 13 }}>Add a user</span>
      </ShareButton>
      <ShareButton icon="link" title="Copy share link" forceTitle iconInlineLeft color="grayDarker" onClick={() => {}}>
        <span style={{ fontSize: 13 }}>Copy link</span>
      </ShareButton>
    </Spec>
  </Stack>
)

export const States = () => (
  <Stack>
    <Spec caption="enabled / disabled / disabled+hideDisableFade — disabled is the read-only guest's view of a shared device">
      <ShareButton icon="share-nodes" title="Share device" color="primary" onClick={() => {}} />
      <ShareButton icon="share-nodes" title="Share device" color="primary" disabled onClick={() => {}} />
      <ShareButton icon="share-nodes" title="Share device" color="primary" disabled hideDisableFade onClick={() => {}} />
    </Spec>
    <Spec caption="loading — the icon is force-swapped for a spinning spinner-third while the share is saving">
      <ShareButton icon="share-nodes" title="Sharing…" color="primary" loading onClick={() => {}} />
      <ShareButton variant="contained" icon="share-nodes" title="Sharing…" color="primary" loading onClick={() => {}} />
    </Spec>
  </Stack>
)
