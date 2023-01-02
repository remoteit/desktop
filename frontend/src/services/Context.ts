import { createContext } from 'react'
import { Attribute } from '../components/Attributes'

export const DeviceListContext = createContext<IDeviceListContext>({
  device: {} as IDevice,
  connections: [],
  attributes: [],
  required: {} as Attribute,
})

export const DeviceContext = createContext<IDeviceContext>({
  user: {} as IUser,
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
  errorTypes: [],
  activeTypes: [],
  highlightTypes: [],
  state: undefined,
  proxy: undefined,
  relay: undefined,
})
