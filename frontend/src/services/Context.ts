import { createContext } from 'react'
import { Attribute } from '../components/Attributes'

export const DeviceContext = createContext<IDeviceContext>({
  connections: [],
  device: {} as IDevice,
  attributes: [],
  required: {} as Attribute,
})

export const DiagramContext = createContext<IDiagramContext>({
  activeTypes: [],
  state: undefined,
})
