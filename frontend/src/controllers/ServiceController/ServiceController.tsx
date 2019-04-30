import React from 'react'
import { ServiceListItem } from '../../components/ServiceListItem'
import { IService } from 'remote.it'
import { socket } from '../../services/backend'
import { useStore } from '../../store'

export interface Props {
  service: IService
}

export function ServiceController({ service }: Props) {
  const [{ auth }, dispatch] = useStore()
  // useEffect(() => {
  //   // setTimeout(() => dispatch({ type: INITIALIZED }), 800)
  //   // dispatch({ type: INITIALIZED })

  //   function getInfo() {
  //     socket.emit(
  //       'connectd/info',
  //       (info: { path: string; version: string | null; exists: boolean }) => {
  //         d('connectd info: %O', info)
  //         if (info.exists) setExists(true)
  //         if (info.path) setPath(info.path)
  //         if (info.exists && info.version) setCurrentVersion(info.version)
  //       }
  //     )
  //   }

  //   socket.on('connectd/install/done', (version: string) => {
  //     setCurrentVersion(version)
  //     setInstalling(false)
  //     setInstalled(true)
  //   })

  //   // socket.on('connectd/file/watching', () =>
  //   //   console.log('watching for changes')
  //   // )
  //   socket.on('connectd/file/added', () => {
  //     getInfo()
  //   })
  //   socket.on('connectd/file/udpated', () => {
  //     getInfo()
  //   })
  //   socket.on('connectd/file/removed', () => {
  //     getInfo()
  //     setExists(false)
  //     setCurrentVersion(null)
  //   })
  //   socket.on('connectd/file/error', (error: Error) => console.error(error))

  //   getInfo()

  //   return () => {
  //     socket.off('connectd/install/done')
  //   }
  // }, [installing, installed])

  return (
    <ServiceListItem
      service={service}
      connect={service => {
        console.log('SERVICE:', service)
        socket.emit('service/connect', { service, user: auth.user })
      }}
    />
  )
}
