import React from 'react'
import { Chip } from '@mui/material'

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
    hoverColor: 'primaryLight',
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
  return (
    <Chip
      sx={theme => ({
        color: theme.palette[chip.colorName].main,
        backgroundColor: chip.background ? theme.palette[chip.background].main : undefined,
        fontWeight: 500,
        letterSpacing: 0.2,
      })}
      label={chip.name}
      size="small"
    />
  )
}
