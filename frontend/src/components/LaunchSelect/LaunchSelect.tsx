import React from 'react'
import { List, ListItem, makeStyles } from '@material-ui/core'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { CustomAttributeSettings } from '../CustomAttributeSettings'
import { InlineTemplateSetting } from '../InlineTemplateSetting'
import { AutoLaunchToggle } from '../AutoLaunchToggle'
import { LaunchTypeSelect } from '../LaunchTypeSelect'
import { useApplication } from '../../hooks/useApplication'
import { spacing } from '../../styling'
import { Quote } from '../Quote'

type Props = {
  service: IService
  connection?: IConnection
}

export const LaunchSelect: React.FC<Props> = ({ service, connection }) => {
  if (!connection) connection = newConnection(service)

  const app = useApplication(service, connection)
  const css = useStyles()

  const handleChange = (value: any) => {
    connection &&
      setConnection({
        ...connection,
        launchType: value.toString(),
      })
  }

  return (
    <>
      <LaunchTypeSelect app={app} service={service} connection={connection} onChange={handleChange} />
      <ListItem dense>
        <Quote margin={null} noInset listItem>
          <List className={css.indent} disablePadding>
            <AutoLaunchToggle connection={connection} service={service} />
            <InlineTemplateSetting app={app} connection={connection} service={service} />
            <CustomAttributeSettings app={app} connection={connection} service={service} />
          </List>
        </Quote>
      </ListItem>
    </>
  )
}

const useStyles = makeStyles({
  indent: { marginRight: -spacing.lg },
})
