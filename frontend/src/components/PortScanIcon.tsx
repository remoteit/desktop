import React from 'react'
import { Icon, IconProps } from './Icon'
import { Tooltip } from '@mui/material'

export const PortScanIcon: React.FC<{ state?: IPortScan; port?: number; host?: string }> = ({ state, port, host }) => {
  if (!state) return null

  let title: React.ReactNode,
    props: IconProps = {}

  switch (state) {
    case 'INVALID':
      props.name = 'circle-minus'
      props.color = 'gray'
      break

    case 'REACHABLE':
      title = (
        <>
          Service found!
          <br />
          {host}:{port}
        </>
      )
      props.name = 'check-circle'
      props.color = 'success'
      break

    case 'UNREACHABLE':
      title = (
        <>
          Service not found.
          <br />
          {host}:{port}
        </>
      )
      props.name = 'exclamation-triangle'
      props.color = 'warning'
      break

    case 'SCANNING':
      props.color = 'gray'
      props.spin = true
      props.name = 'spinner-third'
      break
  }

  const StateIcon = <Icon {...props} inlineLeft size="md" fixedWidth />

  return title ? (
    <Tooltip
      title={title}
      componentsProps={{
        popper: {
          sx: {
            '& .MuiTooltip-tooltip': { backgroundColor: `${props.color}.main` },
            '& .MuiTooltip-arrow': { color: `${props.color}.main` },
          },
        },
      }}
      placement="top"
      arrow
    >
      {StateIcon}
    </Tooltip>
  ) : (
    StateIcon
  )
}
