import React from 'react'
import { makeStyles } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { spacing } from '../../styling'

export const DeviceLabel: React.FC<{ device: IDevice }> = ({ device }) => {
  const css = useStyles()
  const label = useSelector((state: ApplicationState) => state.labels.find(l => l.id === device.attributes?.color))

  if (!label) return null

  return <span className={css.label} style={{ backgroundColor: label.color }}></span>
}

const useStyles = makeStyles({
  label: {
    height: '100%',
    width: 8,
    left: -spacing.md,
    position: 'absolute',
    borderTopRightRadius: spacing.xxs,
    borderBottomRightRadius: spacing.xxs,
  },
})
