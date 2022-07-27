import React, { useState } from 'react'
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
}

export const Network: React.FC<Props> = ({ recent, collapse, highlight, ...props }) => {
  const dispatch = useDispatch<Dispatch>()
  const [expanded, setExpanded] = useState<boolean>(!collapse)
  const css = useStyles({ highlight })

  return (
    <List className={css.list}>
      <NetworkListTitle {...props} expanded={expanded} offline={recent}>
        <IconButton
          icon={expanded ? 'caret-down' : 'caret-up'}
          color="grayDark"
          buttonBaseSize="small"
          onClick={() => setExpanded(!expanded)}
          type="solid"
          size="sm"
        />
        {highlight && <Typography className={css.note}>default</Typography>}
        {recent && <ClearButton all onClick={() => dispatch.connections.clearRecent()} />}
      </NetworkListTitle>
      <Collapse in={expanded}>
        {props.network?.serviceIds.map(id => (
          <NetworkListItem serviceId={id} key={id} {...props}>
            {recent && <ClearButton id={id} onClick={() => dispatch.connections.clear(id)} />}
          </NetworkListItem>
        ))}
        {!props.network?.serviceIds.length && (
          <ListItem>
            <ListItemIcon />
            <Typography variant="caption">No Services</Typography>
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
          '& .MuiListItemIcon-root': {
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
    marginRight: spacing.xxs,
  },
}))
