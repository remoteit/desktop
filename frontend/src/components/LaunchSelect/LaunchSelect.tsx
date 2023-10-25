import React from 'react'
import { ListItemQuote } from '../ListItemQuote'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { CustomConnectionSettings } from '../CustomConnectionSettings'
import { InlineTemplateSetting } from '../InlineTemplateSetting'
import { LaunchTypeSelect } from '../LaunchTypeSelect'
import { useApplication } from '../../hooks/useApplication'

type Props = {
  service: IService
  connection?: IConnection
}

export const LaunchSelect: React.FC<Props> = ({ service, connection }) => {
  if (!connection) connection = newConnection(service)

  const app = useApplication(service, connection)

  const handleChange = (value: any) => {
    connection &&
      setConnection({
        ...connection,
        launchType: value.toString(),
      })
  }

  return (
    <>
      <LaunchTypeSelect app={app} onChange={handleChange} />
      {app.launchType !== 'NONE' && (
        <ListItemQuote>
          <InlineTemplateSetting app={app} connection={connection} service={service} />
          <CustomConnectionSettings app={app} connection={connection} service={service} />
        </ListItemQuote>
      )}
    </>
  )
}
