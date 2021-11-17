import React from 'react'
import { Chip, makeStyles, lighten } from '@material-ui/core'
import { colors } from '../styling'

const licenseChipLookup: ILookup<ILicenseChip> = {
  UNKNOWN: { name: 'Unknown', color: colors.grayDarker, colorName: 'grayDarker' },
  EVALUATION: {
    name: 'Evaluation',
    color: colors.warning,
    background: lighten(colors.warning, 0.94),
    colorName: 'warning',
    show: true,
  },
  LICENSED: {
    name: 'Licensed',
    color: colors.white,
    background: colors.primary,
    colorName: 'primary',
    hoverColor: colors.grayDarker,
  },
  UNLICENSED: {
    name: 'Unlicensed',
    color: colors.warning,
    background: lighten(colors.warning, 0.94),
    colorName: 'warning',
    hoverColor: lighten(colors.warning, 0.84),
    disabled: true,
    show: true,
  },
  NON_COMMERCIAL: { name: 'Non-commercial', color: colors.grayDarker, colorName: 'grayDarker' },
  LEGACY: { name: 'Legacy', color: colors.grayDarker, colorName: 'grayDarker' },
  EXEMPT: { name: 'Exempt', color: colors.grayDarker, colorName: 'grayDarker' },
}

export function getLicenseChip(license?: ILicenseTypes): ILicenseChip {
  return licenseChipLookup[license || ''] || licenseChipLookup.UNKNOWN
}

export const LicenseChip: React.FC<{ license?: ILicenseTypes }> = ({ license }) => {
  const chip = getLicenseChip(license)
  const css = useStyles(chip)
  return <Chip className={css.chip} label={chip.name} size="small" />
}

const useStyles = makeStyles({
  chip: (chip: ILicenseChip) => ({
    color: chip.color,
    backgroundColor: chip.background,
    fontWeight: 500,
    letterSpacing: 0.2,
  }),
})
