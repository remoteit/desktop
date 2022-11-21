import { createContext } from 'react'
import { Attribute } from '../components/Attributes'

export const DeviceListContext = createContext<IDeviceListContext>({
  device: {} as IDevice,
  connections: [],
  attributes: [],
  required: {} as Attribute,
})

export const DeviceContext = createContext<IDeviceContext>({
  device: undefined,
  network: undefined,
  connections: [],
  service: undefined,
  connection: {} as IConnection,
  instance: undefined,
  waiting: false,
})

export const DiagramContext = createContext<IDiagramContext>({
  toTypes: undefined,
  activeTypes: [],
  highlightTypes: [],
  state: undefined,
})
