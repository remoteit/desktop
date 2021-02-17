import React from 'react'
import { Title } from '../Title'
import { makeStyles } from '@material-ui/core/styles'
import { ClearButton } from '../../buttons/ClearButton'
import { ServiceListItem } from '../ServiceListItem'
import { Typography, List, Divider } from '@material-ui/core'
import styles from '../../styling'

export interface Props {
  connections: IConnection[]
  services: IService[]
}

export const ConnectionsList: React.FC<Props> = ({ connections, services }) => {
  const css = useStyles()
  const enabled = connections.filter(c => c.enabled)
  const recent = connections.filter(c => !c.enabled)

  return (
    <List>
      {!!enabled.length && (
        <Typography variant="subtitle1">
          <Title>Connected</Title>
        </Typography>
      )}
      {enabled.map(c => (
        <ServiceListItem key={c.id || 0} connection={c} service={services.find(s => s.id === c.id)} />
      ))}
      {!!recent.length && !!enabled.length && <Divider className={css.divider} />}
      {!!recent.length && (
        <Typography variant="subtitle1">
          <Title>Recent</Title>
          <ClearButton all />
        </Typography>
      )}
      {recent.map(c => (
        <ServiceListItem key={c.id || 0} connection={c} service={services.find(s => s.id === c.id)} dense />
      ))}
    </List>
  )
}

const useStyles = makeStyles({
  divider: { marginTop: styles.spacing.lg },
})
