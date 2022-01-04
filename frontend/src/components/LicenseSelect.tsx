import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { getLicenseChip } from './LicenseChip'
import { makeStyles, TextField, MenuItem } from '@material-ui/core'

type Props = { member: IOrganizationMember; disabled?: boolean }

export const LicenseSelect: React.FC<Props> = ({ member, disabled }) => {
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles({ chip: getLicenseChip(member.license) })

  const handleSelect = (license: ILicenseTypes) => {
    dispatch.organization.setMembers([{ ...member, license }])
  }

  return (
    <TextField
      select
      hiddenLabel
      size="small"
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
