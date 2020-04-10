import { List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Checkbox } from '@material-ui/core'
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { colors, spacing } from '../../styling'
import { makeStyles } from '@material-ui/styles'
import { emit } from '../../services/Controller'

export const LocalhostScanForm: React.FC = () => {
  const css = useStyles()
  const { scanData, hostname } = useSelector((state: ApplicationState) => ({
    hostname: state.backend.environment.hostname,
    scanData: state.backend.scanData,
  }))

  useEffect(() => {
    emit('scan', 'localhost')
  }, [])

  console.log('scanData', scanData, hostname)
  //@ts-ignore
  window.scanData = scanData
  return (
    <List>
      {scanData.localhost?.data[0][1].map(row => (
        <ListItem key={row[0]} dense button onClick={() => {}}>
          <ListItemIcon>
            <Checkbox
              edge="start"
              // checked={checked.indexOf(value) !== -1 }
              tabIndex={-1}
              disableRipple
              inputProps={{ 'aria-labelledby': row[0].toString() }}
            />
          </ListItemIcon>
          <ListItemText primary={row[1]} secondary={row[0]} id={row[0].toString()} />
          <ListItemSecondaryAction className={css.actions + ' hidden'}></ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  )
}

const useStyles = makeStyles({
  indent: { paddingLeft: spacing.xxl },
  actions: { right: 70, display: 'none' },
  buttons: {
    width: 121,
    marginLeft: spacing.md,
    marginRight: spacing.lg,
    position: 'relative',
    '& > div': { position: 'absolute', width: '100%' },
    '& > div:last-child': { position: 'relative' },
  },
  details: { '& > span': { marginLeft: spacing.xs } },
  restriction: { color: colors.grayDarker },
  error: { marginRight: spacing.lg },
})
