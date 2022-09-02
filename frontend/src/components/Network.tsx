import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { ClearButton } from '../buttons/ClearButton'
import { NetworkListItem } from './NetworkListItem'
import { NetworkListTitle } from './NetworkListTitle'
import { Typography, Collapse, List, ListItem, ListItemIcon } from '@mui/material'
import { spacing, radius, fontSizes } from '../styling'
import { makeStyles } from '@mui/styles'

export interface Props {
  network?: INetwork
  collapse?: boolean
  recent?: boolean
  noLink?: boolean
  highlight?: boolean
  onClear?: (serviceId: string) => void
}

export const Network: React.FC<Props> = ({ onClear, recent, collapse, highlight, noLink, network }) => {
  const dispatch = useDispatch<Dispatch>()
  const [expanded, setExpanded] = useState<boolean>(!collapse)
  const css = useStyles({ highlight })

  return (
    <List className={css.list}>
      <NetworkListTitle
        network={network}
        noLink={noLink}
        expanded={expanded}
        offline={recent}
        onClick={() => setExpanded(!expanded)}
      >
        {recent && <ClearButton all onClick={() => dispatch.connections.clearRecent()} />}
        <IconButton
          onClick={() => setExpanded(!expanded)}
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
          <NetworkListItem serviceId={id} key={id} network={network}>
            {onClear && <ClearButton id={id} onClick={() => onClear(id)} />}
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
          '& .MuiListItemIcon-root:first-child': {
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
