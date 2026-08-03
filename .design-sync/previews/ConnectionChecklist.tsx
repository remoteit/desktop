import React from 'react'
import { ConnectionChecklist, ConnectionName } from 'remoteit-desktop-frontend'

// The checklist is a hover tooltip over a single pass/fail glyph: green check
// when every applicable checkpoint passed, red times when any failed. Which
// checkpoints apply depends on the route — the connectd* keys only apply to a
// live peer-to-peer tunnel, proxyCanCreate only to a proxied one.
const P2P_PASSING = {
  canBindToPortLocally: true,
  hostnameCanFetch: true,
  hostnameCanResolve: true,
  connectdCanPortBind: true,
  connectdCanStart: true,
  connectdCanConnectToChatServers: true,
  connectdCanAuth: true,
  connectdTunnelCreated: true,
  targetServiceReachable: true,
  proxyCanCreate: true,
}

const connection = (over: any = {}): any => ({
  id: '80:00:00:00:01:0A:BC:DE',
  name: 'shop-floor-pi',
  port: 33000,
  connected: true,
  isP2P: true,
  checkpoint: { ...P2P_PASSING },
  ...over,
})

const Row: React.FC<{ label: string; caption: string; children?: React.ReactNode }> = ({
  label,
  caption,
  children,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 340, fontSize: 14 }}>
    <div style={{ flexGrow: 1, minWidth: 0 }}>
      <ConnectionName name={label} port={33000} />
      <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>{caption}</div>
    </div>
    {children}
  </div>
)

export const AllChecksPass = () => (
  <div style={{ display: 'grid', gap: 14 }}>
    <Row label="shop-floor-pi" caption="Peer to peer · SSH on 22">
      <ConnectionChecklist connection={connection()} />
    </Row>
    <Row label="warehouse-gateway" caption="Proxy · HTTP on 80">
      <ConnectionChecklist
        connection={connection({
          isP2P: false,
          checkpoint: { ...P2P_PASSING },
        })}
      />
    </Row>
  </div>
)

export const TunnelFailed = () => (
  <div style={{ display: 'grid', gap: 14 }}>
    <Row label="shop-floor-pi" caption="Peer to peer · agent authentication failed">
      <ConnectionChecklist
        connection={connection({
          checkpoint: { ...P2P_PASSING, connectdCanAuth: false, connectdTunnelCreated: false },
        })}
      />
    </Row>
    <Row label="lab-jump-host" caption="Peer to peer · target service unreachable">
      <ConnectionChecklist
        connection={connection({
          checkpoint: { ...P2P_PASSING, targetServiceReachable: false },
        })}
      />
    </Row>
  </div>
)

export const LocalBindFailed = () => (
  <Row label="austin-office-router" caption="Local port 33002 already in use">
    <ConnectionChecklist
      connection={connection({
        connected: false,
        isP2P: false,
        checkpoint: { ...P2P_PASSING, canBindToPortLocally: false },
      })}
    />
  </Row>
)

export const MixedFleet = () => (
  <div style={{ display: 'grid', gap: 14 }}>
    <Row label="shop-floor-pi" caption="Peer to peer · SSH on 22">
      <ConnectionChecklist connection={connection()} />
    </Row>
    <Row label="warehouse-gateway" caption="Proxy · HTTP on 80">
      <ConnectionChecklist connection={connection({ isP2P: false })} />
    </Row>
    <Row label="cold-storage-sensor" caption="Proxy · proxy connection refused">
      <ConnectionChecklist
        connection={connection({ isP2P: false, checkpoint: { ...P2P_PASSING, proxyCanCreate: false } })}
      />
    </Row>
    <Row label="build-agent-04" caption="Peer to peer · hostname could not resolve">
      <ConnectionChecklist
        connection={connection({ checkpoint: { ...P2P_PASSING, hostnameCanResolve: false } })}
      />
    </Row>
  </div>
)
