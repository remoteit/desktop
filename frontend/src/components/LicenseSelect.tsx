import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { makeStyles, TextField, MenuItem } from '@material-ui/core'
import { colors } from '../styling'

type Props = { member: IOrganizationMember; disabled?: boolean }

export const LicenseSelect: React.FC<Props> = ({ member, disabled }) => {
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

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
      className={member.license === 'LICENSED' ? css.licensed : undefined}
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

const useStyles = makeStyles({
  licensed: {
    '& .MuiFilledInput-root': {
      backgroundColor: colors.primary,
      color: colors.white,
      fontWeight: 500,
      letterSpacing: 0.2,
      '&:hover:not(.Mui-disabled)': { backgroundColor: colors.grayDarker },
    },
    '& .MuiSelect-icon': { color: colors.white },
  },
})
