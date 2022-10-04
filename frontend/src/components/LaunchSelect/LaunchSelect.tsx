import React from 'react'
import { makeStyles } from '@mui/styles'
import { List, ListItem } from '@mui/material'
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
      <LaunchTypeSelect app={app} onChange={handleChange} />
      <ListItem className={css.group} dense disablePadding>
        <Quote margin={null} noInset indent="listItem">
          <List className={css.indent} disablePadding>
            <AutoLaunchToggle app={app} connection={connection} service={service} />
            <InlineTemplateSetting app={app} connection={connection} service={service} />
            <CustomAttributeSettings app={app} connection={connection} service={service} />
          </List>
        </Quote>
      </ListItem>
    </>
  )
}

const useStyles = makeStyles({
  indent: { marginRight: -spacing.lg, marginTop: -spacing.xs },
  group: { marginBottom: spacing.sm },
})
