import React from 'react'
import { Chip } from '@mui/material'
import { makeStyles } from '@mui/styles'

const licenseChipLookup: ILookup<ILicenseChip> = {
  UNKNOWN: { name: 'Unknown', colorName: 'grayDarker' },
  EVALUATION: {
    name: 'Evaluation',
    background: 'warningHighlight',
    colorName: 'warning',
    show: true,
  },
  LICENSED: {
    name: 'Licensed',
    background: 'primary',
    colorName: 'alwaysWhite',
    hoverColor: 'grayDarker',
  },
  UNLICENSED: {
    name: 'Unlicensed',
    background: 'warningHighlight',
    colorName: 'warning',
    hoverColor: 'warningLightest',
    disabled: true,
    show: true,
  },
  NON_COMMERCIAL: { name: 'Non-commercial', colorName: 'grayDarker' },
  LEGACY: { name: 'Legacy', colorName: 'grayDarker' },
  EXEMPT: { name: 'Exempt', colorName: 'grayDarker' },
}

export function getLicenseChip(license?: ILicenseTypes): ILicenseChip {
  return licenseChipLookup[license || ''] || licenseChipLookup.UNKNOWN
}

export const LicenseChip: React.FC<{ license?: ILicenseTypes }> = ({ license }) => {
  const chip = getLicenseChip(license)
  const css = useStyles(chip)
  return <Chip className={css.chip} label={chip.name} size="small" />
}

const useStyles = makeStyles(({ palette }) => ({
  chip: (chip: ILicenseChip) => ({
    color: palette[chip.colorName].main,
    backgroundColor: chip.background ? palette[chip.background].main : undefined,
    fontWeight: 500,
    letterSpacing: 0.2,
  }),
}))
