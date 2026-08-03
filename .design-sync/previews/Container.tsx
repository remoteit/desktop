import React from 'react'
import { Container, Gutters, Icon } from 'remoteit-desktop-frontend'

/* Layout-only helpers — plain HTML so no second MUI instance is bundled. */
const Frame: React.FC<{ children?: React.ReactNode; height?: number; width?: number }> = ({
  children,
  height = 300,
  width = 560,
}) => (
  <div
    style={{
      height,
      width,
      border: '1px solid rgba(0,0,0,0.12)',
      borderRadius: 8,
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
)

const Title: React.FC<{ children?: React.ReactNode; caption?: string }> = ({ children, caption }) => (
  <Gutters size="lg" top="sm" bottom="sm" sx={{ color: 'grayDarkest.main' }}>
    <div style={{ fontSize: 17, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name="router" size="md" color="primary" />
      {children}
    </div>
    {caption && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{caption}</div>}
  </Gutters>
)

const ServiceRow: React.FC<{ name: string; port: number; icon: string }> = ({ name, port, icon }) => (
  <Gutters size="lg" top="xxs" bottom="xxs" sx={{ color: 'grayDarkest.main' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        borderRadius: 6,
        background: 'rgba(0,150,231,0.06)',
      }}
    >
      <Icon name={icon} size="md" color="primary" />
      <span style={{ flexGrow: 1, fontSize: 14 }}>{name}</span>
      <span style={{ fontSize: 12, opacity: 0.6, fontFamily: 'ui-monospace, monospace' }}>:{port}</span>
    </div>
  </Gutters>
)

const Services = () => (
  <>
    <ServiceRow name="SSH" port={22} icon="terminal" />
    <ServiceRow name="VNC" port={5900} icon="desktop" />
    <ServiceRow name="HTTP admin" port={8080} icon="globe" />
    <ServiceRow name="Node-RED" port={1880} icon="chart-network" />
    <ServiceRow name="Mosquitto MQTT" port={1883} icon="share-nodes" />
  </>
)

export const HeaderAndBody = () => (
  <Frame>
    <Container header={<Title caption="Raspberry Pi 4 · Ubuntu 22.04">shop-floor-pi</Title>}>
      <Services />
    </Container>
  </Frame>
)

export const WithFooter = () => (
  <Frame>
    <Container
      header={<Title caption="5 services · online">warehouse-gateway</Title>}
      footer={
        <Gutters size="lg" top="sm" bottom="sm" sx={{ color: 'grayDark.main' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Icon name="circle-check" size="sm" color="success" />
            Last checked in 2 minutes ago
          </div>
        </Gutters>
      }
    >
      <Services />
    </Container>
  </Frame>
)

export const TintedBackground = () => (
  <Frame>
    <Container
      backgroundColor="screen"
      header={<Title caption="Ubuntu 22.04 · us-west-2">edge-node-04</Title>}
    >
      <Services />
    </Container>
  </Frame>
)

export const WithDrawer = () => (
  <Frame>
    <Container
      header={<Title caption="macOS 14 · this device">jamie-macbook</Title>}
      drawer={
        <Gutters size="lg" top="md" bottom="md" sx={{ color: 'grayDarkest.main', width: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Connection details</div>
          <div style={{ display: 'grid', gap: 8, fontSize: 12, opacity: 0.75 }}>
            <div>Local port 33000</div>
            <div>Peer to peer</div>
            <div>Round trip 24 ms</div>
            <div>Up 4h 12m</div>
          </div>
        </Gutters>
      }
    >
      <Services />
    </Container>
  </Frame>
)
