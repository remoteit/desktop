import React, { useState } from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { Icon } from './Icon'
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

export const Network: React.FC<Props> = ({ onClear, recent, collapse, highlight, ...props }) => {
  const dispatch = useDispatch<Dispatch>()
  const [expanded, setExpanded] = useState<boolean>(!collapse)
  const css = useStyles({ highlight })

  return (
    <List className={css.list}>
      <NetworkListTitle {...props} expanded={expanded} offline={recent} onClick={() => setExpanded(!expanded)}>
        {recent && <ClearButton all onClick={() => dispatch.connections.clearRecent()} />}
        <Icon
          name={expanded ? 'caret-down' : 'caret-up'}
          color={highlight ? 'primary' : 'grayDark'}
          type="solid"
          size="sm"
          inlineLeft
        />
      </NetworkListTitle>
      <Collapse in={expanded}>
        {props.network?.serviceIds.map(id => (
          <NetworkListItem serviceId={id} key={id} {...props}>
            {onClear && <ClearButton id={id} onClick={() => onClear(id)} />}
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
      : { '& button': { color: palette.gray.main, marginRight: spacing.xs } },
  note: {
    color: palette.primary.main,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    fontWeight: 500,
    fontSize: fontSizes.xxxs,
    marginRight: spacing.sm,
  },
}))
