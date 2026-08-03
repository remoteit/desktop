import React from 'react'
import { Provider } from 'react-redux'
import { Tags } from 'remoteit-desktop-frontend'

/* Tags -> Tag -> useLabel() reads `state.labels` through react-redux's
   useSelector, so without a <Provider> every cell renders blank (the whole
   cell throws "could not find react-redux context value"). react-redux 9 keeps
   its context in a globalThis registry keyed by React.createContext, and the
   preview compiles against the same external window.React as the DS bundle —
   so this Provider and the bundle's useSelector share ONE context object.
   (Do not reach for @mui/material the same way: a second MUI instance really
   does fork ThemeProvider context and renders the component unstyled.)

   Values mirror frontend/src/models/labels.ts exactly — ITag.color is a label
   id, not a css color. */
const labels = [
  { id: 0, name: 'none', color: 'inherit', hidden: true },
  { id: 1, name: 'Gray', color: '#797c86' },
  { id: 2, name: 'Red', color: '#E65B4C' },
  { id: 3, name: 'Orange', color: '#EF922E' },
  { id: 4, name: 'Yellow', color: '#F5CC17' },
  { id: 5, name: 'Lime', color: '#BBD40F' },
  { id: 6, name: 'Green', color: '#61C951' },
  { id: 7, name: 'Teal', color: '#31C49E' },
  { id: 8, name: 'Sky', color: '#4AB8F4' },
  { id: 9, name: 'Blue', color: '#6193FE' },
]

const store: any = {
  getState: () => ({ labels }),
  subscribe: () => () => {},
  dispatch: (action: any) => action,
  replaceReducer: () => {},
}

const fleetTags = [
  { name: 'production', color: 2 },
  { name: 'field-unit', color: 3 },
  { name: 'us-west', color: 8 },
]

const Row: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 520, minHeight: 32 }}>
    <span style={{ fontSize: 13, opacity: 0.65, width: 165, flexShrink: 0 }}>{label}</span>
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>{children}</span>
  </div>
)

const Frame: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
  </Provider>
)

export const Basic = () => (
  <Frame>
    <Row label="raspberrypi-field-01">
      <Tags tags={fleetTags} max={9} />
    </Row>
    <Row label="jump-host-us-west">
      <Tags tags={[{ name: 'staging', color: 6 }]} max={9} />
    </Row>
  </Frame>
)

export const SmallAndCollapsed = () => (
  <Frame>
    <Row label="Small, within max">
      <Tags small max={4} tags={fleetTags} />
    </Row>
    <Row label="Small, collapsed to dots">
      <Tags small max={1} tags={fleetTags} />
    </Row>
    <Row label="Labels hidden">
      <Tags hideLabels max={9} tags={fleetTags} />
    </Row>
  </Frame>
)

export const EmptyAndDeletable = () => (
  <Frame>
    <Row label="No tags yet">
      <Tags tags={[]} showEmpty max={9} />
    </Row>
    <Row label="Editing tags">
      <Tags tags={fleetTags} max={9} onDelete={() => {}} onClick={() => {}} />
    </Row>
  </Frame>
)

export const ColorRange = () => (
  <Frame>
    <Row label="Environment">
      <Tags
        max={9}
        tags={[
          { name: 'production', color: 2 },
          { name: 'staging', color: 4 },
          { name: 'development', color: 6 },
        ]}
      />
    </Row>
    <Row label="Region">
      <Tags
        max={9}
        tags={[
          { name: 'us-west', color: 8 },
          { name: 'us-east', color: 9 },
          { name: 'eu-central', color: 7 },
        ]}
      />
    </Row>
  </Frame>
)
