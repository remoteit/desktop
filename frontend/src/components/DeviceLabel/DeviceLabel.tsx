import React from 'react'
import { makeStyles } from '@material-ui/core'
import { labelLookup } from '../../models/labels'
import { spacing } from '../../styling'

export const DeviceLabel: React.FC<{ device: IDevice }> = ({ device }) => {
  const css = useStyles()
  const label = !!device.attributes?.color ? labelLookup[device.attributes.color] : undefined

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
