import React from 'react'
import { Link } from 'react-router-dom'
import { IconButton } from '../buttons/IconButton'
import { ClearButton } from '../buttons/ClearButton'
import { NetworkListItem } from './NetworkListItem'
import { NetworkListTitle } from './NetworkListTitle'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Typography, Collapse, List, ListItem, ListItemIcon } from '@mui/material'
import { spacing, radius, fontSizes } from '../styling'
import { makeStyles } from '@mui/styles'

export interface Props {
  network?: INetwork
  connectionsPage?: boolean
  recent?: boolean
  noLink?: boolean
  highlight?: boolean
  onClear?: (serviceId: string) => void
}

export const Network: React.FC<Props> = ({ onClear, recent, highlight, noLink, network, connectionsPage }) => {
  const dispatch = useDispatch<Dispatch>()
  const { collapsed } = useSelector((state: ApplicationState) => state.ui)
  const css = useStyles({ highlight })

  if (!network?.id) return null

  const expanded = !collapsed.includes(network.id)
  const toggle = () => {
    if (expanded) collapsed.push(network.id)
    else collapsed.splice(collapsed.indexOf(network.id), 1)
    dispatch.ui.set({ collapsed: [...collapsed] })
  }

  return (
    <List className={css.list}>
      <NetworkListTitle network={network} noLink={noLink} expanded={expanded} offline={recent} onClick={toggle}>
        {recent && <ClearButton all onClick={() => dispatch.connections.clearRecent()} />}
        <IconButton
          onClick={toggle}
          className="hidden"
          name={expanded ? 'caret-down' : 'caret-up'}
          color={highlight ? 'primary' : 'grayDark'}
          disabled={noLink}
          hideDisableFade
          buttonBaseSize="small"
          type="solid"
          size="sm"
        />
      </NetworkListTitle>
      <Collapse in={expanded}>
        {network?.serviceIds.map(id => (
          <NetworkListItem
            key={id}
            serviceId={id}
            network={network}
            fallbackName={network.connectionNames[id]}
            connectionsPage={connectionsPage}
          >
            {onClear && <ClearButton id={id} onClick={() => onClear(id)} className="hidden" />}
          </NetworkListItem>
        ))}
        {!network?.serviceIds.length && (
          <ListItem>
            <ListItemIcon />
            <Typography variant="caption">
              Add services through the <Link to="/devices">device list</Link>
            </Typography>
          </ListItem>
        )}
      </Collapse>
    </List>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  list: ({ highlight }: Props) =>
    highlight
      ? {
          backgroundColor: highlight ? palette.primaryHighlight.main : undefined,
          margin: spacing.md,
          borderRadius: radius,
          '& .MuiListItem-root': {
            width: `calc(100% - ${spacing.lg}px)`,
            marginLeft: spacing.sm,
          },
          '& .MuiListItemIcon-root:first-of-type': {
            marginLeft: -spacing.sm,
          },
          '& .MuiListItem-button': {
            '&:hover,&:focus,&.Mui-selected': {
              backgroundColor: palette.white.main,
            },
          },
          '& .Mui-selected': {
            backgroundColor: palette.white.main,
          },
        }
      : {},
  note: {
    color: palette.primary.main,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    fontWeight: 500,
    fontSize: fontSizes.xxxs,
    marginRight: spacing.sm,
  },
}))
