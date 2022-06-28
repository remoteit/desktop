import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { getLicenseChip } from './LicenseChip'
import { makeStyles } from '@mui/styles'
import { TextField, TextFieldProps, MenuItem } from '@mui/material'

type Props = { member: IOrganizationMember; size?: TextFieldProps['size']; disabled?: boolean }

export const LicenseSelect: React.FC<Props> = ({ member, size = 'small', disabled }) => {
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles({ chip: getLicenseChip(member.license) })

  const handleSelect = (license: ILicenseTypes) => {
    dispatch.organization.setMembers([{ ...member, license }])
  }

  return (
    <TextField
      select
      hiddenLabel={size === 'small'}
      label={size === 'small' ? undefined : 'License'}
      size={size}
      disabled={disabled}
      value={member.license}
      variant="filled"
      className={css.licensed}
      onChange={e => handleSelect(e.target.value as ILicenseTypes)}
    >
      <MenuItem dense value="LICENSED">
        Licensed
      </MenuItem>
      <MenuItem dense value="UNLICENSED">
        Unlicensed
      </MenuItem>
    </TextField>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  licensed: ({ chip }: { chip: ILicenseChip }) => ({
    '& .MuiFormLabel-root': { color: palette[chip.colorName].main },
    '& .MuiFilledInput-root': {
      color: palette[chip.colorName].main,
      backgroundColor: chip.background && palette[chip.background].main,
      fontWeight: 500,
      letterSpacing: 0.2,
      '&:hover:not(.Mui-disabled)': { backgroundColor: chip.hoverColor },
    },
    '& .MuiSelect-icon': { color: palette[chip.colorName].main },
  }),
}))
