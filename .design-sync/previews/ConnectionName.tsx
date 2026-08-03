import React from 'react'
import { ConnectionName } from 'remoteit-desktop-frontend'

// ConnectionName dims the hyphens in a device name and appends the bound local
// port as a cite. It's the title cell of every row in the Connections list.
const Rows: React.FC<{ children?: React.ReactNode; width?: number }> = ({ children, width = 420 }) => (
  <div style={{ display: 'grid', gap: 10, width: '100%', maxWidth: width, fontSize: 14 }}>{children}</div>
)

export const WithPort = () => (
  <Rows>
    <ConnectionName name="shop-floor-pi" port={33000} />
    <ConnectionName name="warehouse-gateway" port={33001} />
    <ConnectionName name="austin-office-router" port={33002} />
  </Rows>
)

export const NoPort = () => (
  <Rows>
    <ConnectionName name="shop-floor-pi" />
    <ConnectionName name="build-agent-04" />
    <ConnectionName />
  </Rows>
)

export const Colors = () => (
  <Rows>
    <ConnectionName name="warehouse-gateway" port={33001} color="primary" />
    <ConnectionName name="cold-storage-sensor" port={33004} color="success" />
    <ConnectionName name="lab-jump-host" port={33005} color="danger" />
    <ConnectionName name="retired-kiosk-pi" port={33006} color="grayDark" />
  </Rows>
)

export const Truncation = () => (
  <Rows width={240}>
    <ConnectionName name="manufacturing-line-3-vision-controller-primary" port={33010} />
    <ConnectionName name="eu-west-1-edge-relay-gateway-standby" port={33011} />
  </Rows>
)
