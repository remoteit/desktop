import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { getLicenseChip } from './LicenseChip'
import { TextField, TextFieldProps, MenuItem } from '@mui/material'

type Props = { member: IOrganizationMember; size?: TextFieldProps['size']; disabled?: boolean }

export const LicenseSelect: React.FC<Props> = ({ member, size = 'small', disabled }) => {
  const dispatch = useDispatch<Dispatch>()
  const chip = getLicenseChip(member.license)

  const handleSelect = (license: ILicenseTypes) => {
    dispatch.organization.setMembers([{ ...member, license }])
  }

  return (
    <TextField
      select
      size={size}
      label={size === 'small' ? undefined : 'License'}
      hiddenLabel={size === 'small'}
      disabled={disabled}
      value={member.license}
      variant="filled"
      onChange={e => handleSelect(e.target.value as ILicenseTypes)}
      onClick={event => event.stopPropagation()}
      sx={
        disabled
          ? undefined
          : theme => ({
              '& .MuiFormLabel-root': { color: theme.palette[chip.colorName].main },
              '& .MuiInputBase-root': {
                color: theme.palette[chip.colorName].main,
                backgroundColor: chip.background ? theme.palette[chip.background].main : undefined,
                fontWeight: 500,
                letterSpacing: 0.2,
                '&:hover:not(.Mui-disabled)': {
                  backgroundColor: chip.hoverColor ? theme.palette[chip.hoverColor].main : undefined,
                },
              },
              '& .MuiSelect-icon': { color: theme.palette[chip.colorName].main },
            })
      }
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
