import React from 'react'
import { Gutters, Icon } from 'remoteit-desktop-frontend'

/* The dashed frame is the "page" edge — it makes the Gutters margin visible. */
const Page: React.FC<{ children?: React.ReactNode; width?: number }> = ({ children, width = 520 }) => (
  <div
    style={{
      width,
      border: '1px dashed rgba(0,150,231,0.45)',
      borderRadius: 6,
      background: 'rgba(0,150,231,0.04)',
    }}
  >
    {children}
  </div>
)

const Block: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.12)',
      borderRadius: 6,
      padding: '10px 12px',
      fontSize: 13,
    }}
  >
    {children}
  </div>
)

export const Sizes = () => (
  <Page>
    {(['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const).map(size => (
      <Gutters key={size} size={size} top="xs" bottom="xs" sx={{ color: 'grayDarkest.main' }}>
        <Block>
          size=&quot;{size}&quot; — shop-floor-pi
        </Block>
      </Gutters>
    ))}
  </Page>
)

export const Inset = () => (
  <Page>
    <Gutters top="md" bottom="xs" sx={{ color: 'grayDarkest.main' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon name="router" size="md" color="primary" fixedWidth />
        <span style={{ fontSize: 14, fontWeight: 500 }}>warehouse-gateway</span>
      </div>
    </Gutters>
    <Gutters inset="icon" top={null} bottom="xs" sx={{ color: 'grayDarkest.main' }}>
      <Block>inset=&quot;icon&quot; — aligns under the 44px icon column</Block>
    </Gutters>
    <Gutters inset="lg" top={null} bottom="xs" sx={{ color: 'grayDarkest.main' }}>
      <Block>inset=&quot;lg&quot;</Block>
    </Gutters>
    <Gutters inset={null} top={null} bottom="md" sx={{ color: 'grayDarkest.main' }}>
      <Block>no inset</Block>
    </Gutters>
  </Page>
)

export const TopAndBottom = () => (
  <Page>
    <Gutters top="xxl" bottom="xxs" sx={{ color: 'grayDarkest.main' }}>
      <Block>top=&quot;xxl&quot; bottom=&quot;xxs&quot;</Block>
    </Gutters>
    <Gutters top={null} bottom={null} sx={{ color: 'grayDarkest.main' }}>
      <Block>top=null bottom=null — flush rows</Block>
    </Gutters>
    <Gutters top={null} bottom={null} sx={{ color: 'grayDarkest.main' }}>
      <Block>top=null bottom=null — flush rows</Block>
    </Gutters>
    <Gutters top="xs" bottom="xl" sx={{ color: 'grayDarkest.main' }}>
      <Block>top=&quot;xs&quot; bottom=&quot;xl&quot;</Block>
    </Gutters>
  </Page>
)

export const Centered = () => (
  <Page>
    <Gutters center top="lg" bottom="lg" sx={{ color: 'grayDarkest.main' }}>
      <Icon name="cloud" size="xl" color="primary" />
      <div style={{ fontSize: 15, fontWeight: 500, marginTop: 8 }}>No devices yet</div>
      <div style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>
        Install Remote.It on a Raspberry Pi to see it here.
      </div>
    </Gutters>
  </Page>
)
