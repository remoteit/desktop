import React, { useState, useRef } from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { useMediaQuery, makeStyles, Checkbox, ListSubheader, ListItemIcon, LinearProgress } from '@material-ui/core'
import { DeviceListHeaderTitle } from './DeviceListHeaderTitle'
import { Attribute } from '../helpers/attributes'
import { Icon } from './Icon'

type Props = {
  primary: Attribute
  attributes?: Attribute[]
  columnWidths: ILookup<number>
  select?: boolean
  fetching?: boolean
}

export const DeviceListHeader: React.FC<Props> = ({ primary, attributes = [], columnWidths, select, fetching }) => {
  const largeScreen = useMediaQuery('(min-width:600px)')
  const [resize, setResize] = useState<number>(0)
  const { ui } = useDispatch<Dispatch>()
  const containerRef = useRef<HTMLLIElement>(null)
  const moveRef = useRef<[string, number, number, number, number]>(['', 0, 0, 0, 0])
  const css = useStyles()

  const onDown = (event: React.MouseEvent, attribute: Attribute) => {
    const containerX = containerRef.current?.getBoundingClientRect().left || 0
    const containerY = containerRef.current?.parentElement?.getBoundingClientRect().height || 0
    console.log('ONDOWN', containerX, containerY, event)
    moveRef.current = [attribute.id, attribute.width(columnWidths), event.clientX, containerX, containerY]
    event.preventDefault()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const onUp = (event: MouseEvent) => {
    event.preventDefault()
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    ui.resizeColumn({ id: moveRef.current[0], width: moveRef.current[1] + (event.clientX - moveRef.current[2]) })
    setResize(0)
  }

  const onMove = (event: MouseEvent) => {
    console.log(event.screenX, event.clientX - moveRef.current[2], event)
    setResize(event.pageX - moveRef.current[3])
  }

  return (
    <ListSubheader className={css.header} ref={containerRef}>
      <span
        className={css.handle}
        style={{ left: resize, height: moveRef.current[4], display: resize ? 'block' : 'none' }}
      />
      <DeviceListHeaderTitle attribute={primary} columnWidths={columnWidths} onMouseDown={onDown} sticky>
        <ListItemIcon>
          {select && (
            <Checkbox
              // checked={checked}
              // indeterminate={indeterminate}
              // inputRef={inputRef}
              // onChange={event => onClick(event.target.checked)}
              className={css.checkbox}
              onClick={event => event.stopPropagation()}
              checkedIcon={<Icon name="check-square" size="md" type="solid" />}
              indeterminateIcon={<Icon name="minus-square" size="md" type="solid" />}
              icon={<Icon name="square" size="md" />}
              color="primary"
            />
          )}
        </ListItemIcon>
      </DeviceListHeaderTitle>
      {largeScreen &&
        attributes?.map(attribute => (
          <DeviceListHeaderTitle
            key={attribute.id}
            attribute={attribute}
            columnWidths={columnWidths}
            onMouseDown={onDown}
          />
        ))}
      {fetching && <LinearProgress className={css.fetching} />}
    </ListSubheader>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  header: {
    borderBottom: `1px solid ${palette.grayLighter.main}`,
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
