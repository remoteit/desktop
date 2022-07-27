import React, { useState, useRef } from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { makeStyles } from '@mui/styles'
import { ListSubheader, ListItemIcon, LinearProgress } from '@mui/material'
import { DeviceListHeaderCheckbox } from './DeviceListHeaderCheckbox'
import { DeviceListHeaderTitle } from './DeviceListHeaderTitle'
import { Attribute } from './Attributes'

const MIN_WIDTH = 50

type Props = {
  primary: Attribute
  attributes?: Attribute[]
  columnWidths: ILookup<number>
  devices: IDevice[]
  select?: boolean
  fetching?: boolean
}

export const DeviceListHeader: React.FC<Props> = ({
  primary,
  attributes = [],
  columnWidths,
  devices,
  select,
  fetching,
}) => {
  const { ui } = useDispatch<Dispatch>()
  const [resize, setResize] = useState<number>(0)
  const containerRef = useRef<HTMLLIElement>(null)
  const moveRef = useRef<[string, number, number, number, number]>(['', 0, 0, 0, 0])
  const css = useStyles()

  const onDown = (event: React.MouseEvent, attribute: Attribute) => {
    const containerX = containerRef.current?.getBoundingClientRect().left || 0
    const containerY = containerRef.current?.parentElement?.getBoundingClientRect().height || 0
    moveRef.current = [attribute.id, attribute.width(columnWidths), event.clientX, containerX, containerY]
    event.preventDefault()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const onUp = (event: MouseEvent) => {
    event.preventDefault()
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    const px = Math.max(moveRef.current[1] + (event.clientX - moveRef.current[2]), MIN_WIDTH)
    // const containerPx = containerRef.current?.parentElement?.getBoundingClientRect().width || 1000
    // const percentage = Math.round((px / containerPx) * 10000) / 100
    ui.resizeColumn({ id: moveRef.current[0], width: px })
    setResize(0)
  }

  const onMove = (event: MouseEvent) => {
    if (moveRef.current[1] + (event.clientX - moveRef.current[2]) < MIN_WIDTH) return
    setResize(event.pageX - moveRef.current[3])
  }

  return (
    <ListSubheader className={css.header} ref={containerRef} disableGutters>
      <span
        className={css.handle}
        style={{ left: resize, height: moveRef.current[4], display: resize ? 'block' : 'none' }}
      />
      <DeviceListHeaderTitle attribute={primary} onMouseDown={onDown} sticky>
        <ListItemIcon>
          <DeviceListHeaderCheckbox select={select} devices={devices} />
        </ListItemIcon>
      </DeviceListHeaderTitle>
      {attributes?.map(attribute => (
        <DeviceListHeaderTitle key={attribute.id} attribute={attribute} onMouseDown={onDown} />
      ))}
      {fetching && <LinearProgress className={css.fetching} />}
    </ListSubheader>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  header: {
    padding: 0,
    minWidth: '100%',
    boxShadow: `inset 0 -1px ${palette.grayLighter.main}`,
  },
  fetching: {
    position: 'absolute',
    width: '100%',
    zIndex: 10,
    height: 2,
    bottom: 0,
  },
  checkbox: {
    maxWidth: 60,
  },
  handle: {
    position: 'absolute',
    zIndex: 80,
    top: 0,
    width: 1,
    borderRight: `1px dotted ${palette.primaryLight.main}`,
  },
}))
