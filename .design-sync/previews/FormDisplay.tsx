import React from 'react'
import { FormDisplay } from 'remoteit-desktop-frontend'

const List: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 560 }}>{children}</ul>
)

export const Basic = () => (
  <List>
    <FormDisplay icon="pen" label="Service name" value="SSH — raspberrypi-field-01" onClick={() => {}} />
    <FormDisplay icon="ethernet" label="Local port" value={33001} onClick={() => {}} />
    <FormDisplay icon="server" label="Service host" value="192.168.1.24" onClick={() => {}} />
  </List>
)

export const ValueStates = () => (
  <List>
    <FormDisplay
      icon="clock"
      label="Idle timeout"
      value={15}
      displayValue="15 minutes"
      modified
      onClick={() => {}}
    />
    <FormDisplay icon="tag" label="Description" value="" onClick={() => {}} />
    <FormDisplay
      icon="globe"
      label="Public URL"
      value="https://cranky-otter.remote.it"
      loading
      onClick={() => {}}
    />
  </List>
)

export const DisabledAndDisplayOnly = () => (
  <List>
    <FormDisplay icon="lock" label="Device ID" value="80:00:00:00:01:0A:2F:C4" disabled />
    <FormDisplay icon="key" label="Owner" value="ops@remote.it" displayOnly />
    <FormDisplay
      icon="triangle-exclamation"
      label="Custom port range"
      value="33000 – 42000"
      color="#d6335c"
      onClick={() => {}}
    />
  </List>
)

export const WithDelete = () => (
  <List>
    <FormDisplay
      icon="route"
      label="Connect link"
      value="cranky-otter"
      onClick={() => {}}
      onDelete={() => {}}
      warning="Removing the link will break any bookmark using it."
    />
    <FormDisplay icon="hourglass" label="Expires" value="Jan 14, 2027" onClick={() => {}} onDelete={() => {}} />
  </List>
)
