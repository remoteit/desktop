import React from 'react'
import { InlineTextFieldSetting } from 'remoteit-desktop-frontend'

const List: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 560 }}>{children}</ul>
)

export const Basic = () => (
  <List>
    <InlineTextFieldSetting
      icon="pen"
      label="Service name"
      value="SSH — raspberrypi-field-01"
      resetValue="SSH"
      onSave={() => {}}
    />
    <InlineTextFieldSetting icon="ethernet" label="Local port" value={33001} type="number" onSave={() => {}} />
    <InlineTextFieldSetting icon="server" label="Service host" value="192.168.1.24" onSave={() => {}} />
  </List>
)

export const ModifiedAndDisplayValue = () => (
  <List>
    <InlineTextFieldSetting
      icon="clock"
      label="Idle timeout"
      value={45}
      displayValue="45 minutes"
      modified
      resetValue={15}
      onSave={() => {}}
    />
    <InlineTextFieldSetting
      icon="route"
      label="Custom port range"
      value="33000-42000"
      displayValue="33000 – 42000"
      modified
      onSave={() => {}}
    />
  </List>
)

export const EmptyAndDisabled = () => (
  <List>
    <InlineTextFieldSetting
      icon="tag"
      label="Description"
      value=""
      placeholder="Describe this service"
      onSave={() => {}}
    />
    <InlineTextFieldSetting
      icon="lock"
      label="Device ID"
      value="80:00:00:00:01:0A:2F:C4"
      disabled
      onSave={() => {}}
    />
  </List>
)

export const MultilineAndDelete = () => (
  <List>
    <InlineTextFieldSetting
      icon="file-alt"
      label="Launch template"
      multiline
      value="ssh -l pi -p [port] [host] -o StrictHostKeyChecking=no"
      onSave={() => {}}
    />
    <InlineTextFieldSetting
      icon="globe"
      label="Connect link"
      value="cranky-otter"
      onSave={() => {}}
      onDelete={() => {}}
      warning="Removing the link will break any bookmark using it."
    />
  </List>
)
