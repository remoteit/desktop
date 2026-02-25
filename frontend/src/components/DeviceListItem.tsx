import React, { useState, useContext } from 'react'
import { useHistory } from 'react-router-dom'
import { MobileServiceName } from './MobileServiceName'
import { DeviceListContext } from '../services/Context'
import { AttributeValueMemo } from './AttributeValue'
import { ConnectionStateIcon } from './ConnectionStateIcon'
import { GridListItem } from './GridListItem'
import { Restore } from './Restore'
import { Icon } from './Icon'
import { Box } from '@mui/material'
import { useSelect } from '../hooks/useSelect'

type Props = {
  restore?: boolean
  select?: boolean
  selected: string[]
  mobile?: boolean
  disabled?: boolean
  duplicateName?: boolean
  onClick?: () => void
}

export const DeviceListItem: React.FC<Props> = ({
  restore,
  select,
  selected,
  mobile,
  disabled,
  duplicateName,
  onClick,
}) => {
  const [startRestore, setStartRestore] = useState<boolean>(false)
  const { connections, device, service, attributes, required } = useContext(DeviceListContext)
  const connection =
    connections && (service ? connections.find(c => c.id === service.id) : connections.find(c => c.enabled))
  const history = useHistory()

  if (!device) return null

  const { isSelected, isAnchorRow, handleSelect } = useSelect({
    deviceId: device.id,
    selected,
    selectMode: select,
  })

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onClick?.()
    if (select) handleSelect(event?.shiftKey)
    else if (restore) setStartRestore(true)
    else history.push(`/devices/${device.id}${service ? `/${service.id}/connect` : ''}`)
  }

  return (
    <>
      <GridListItem
        onClick={handleClick}
        selected={isSelected}
        disabled={disabled}
        mobile={mobile}
        sx={
          isAnchorRow
            ? {
                '& > .MuiBox-root:first-of-type': {
                  boxShadow: theme => `inset 2px 0 0 ${theme.palette.primary.main}`,
                },
              }
            : undefined
        }
        icon={
          duplicateName ? null : select ? (
            isSelected ? (
              <Icon name="check-square" size="md" type="solid" color="primary" />
            ) : (
              <Icon name="square" size="md" />
            )
          ) : (
            <ConnectionStateIcon className="hoverHide" device={device} connection={connection} />
          )
        }
        required={
          mobile && service ? (
            <MobileServiceName {...{ mobile, device, service, connection, connections, duplicateName }} />
          ) : (
            !duplicateName && (
              <AttributeValueMemo {...{ mobile, device, service, connection, connections, attribute: required }} />
            )
          )
        }
        disableGutters
      >
        {attributes?.map(attribute => (
          <Box key={attribute.id}>
            <AttributeValueMemo {...{ mobile, device, service, attribute, connection, connections }} />
          </Box>
        ))}
      </GridListItem>
      {restore && <Restore deviceId={device.id} restore={startRestore} onComplete={() => setStartRestore(false)} />}
    </>
  )
}
