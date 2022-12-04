import React from 'react'
import classnames from 'classnames'
import { ListItemLocation } from './ListItemLocation'
import { useStyles } from './NetworkListItem'
import { Avatar } from './Avatar'
import { Title } from './Title'
import { Icon } from './Icon'

export interface Props {
  network?: INetwork
  expanded?: boolean
  offline?: boolean
  noLink?: boolean
  onClick?: () => void
  children?: React.ReactNode
}

export const NetworkListTitle: React.FC<Props> = ({ network, expanded = true, offline, noLink, onClick, children }) => {
  const css = useStyles({ enabled: network?.enabled, offline })
  return (
    <ListItemLocation
      className={css.item}
      exactMatch
      icon={
        <>
          {false ? (
            <Avatar email={network?.owner?.email} size={24} />
          ) : (
            <Icon
              className={classnames(css.mergeIcon, noLink || 'hoverHide')}
              name={network?.icon}
              type={network?.iconType}
              color={network?.enabled ? 'primary' : undefined}
            />
          )}
          {noLink || (
            <Icon
              className={classnames(css.mergeIcon, css.hover, 'hidden')}
              name="sliders-h"
              type="light"
              size="md"
              color={network?.enabled ? 'primary' : undefined}
            />
          )}
        </>
      }
      pathname={noLink ? undefined : `/networks/${network?.id}`}
      onClick={noLink ? onClick : undefined}
      title={
        <Title className={css.text} enabled={network?.enabled}>
          {network?.name}
          {expanded ? '' : ' ...'}
        </Title>
      }
      dense
    >
      {children}
    </ListItemLocation>
  )
}
