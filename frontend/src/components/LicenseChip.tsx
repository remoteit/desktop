import React from 'react'
import { Chip, makeStyles } from '@material-ui/core'

export const LicenseChip: React.FC<{ chip: ILicenseChip }> = ({ chip }) => {
  const css = useStyles(chip)
  return <Chip className={css.chip} label={chip.name} size="small" />
}

const useStyles = makeStyles({
  chip: (chip: ILicenseChip) => ({
    color: chip.color,
    backgroundColor: chip.background,
    fontFamily: 'Roboto Mono',
  }),
})
