import React from 'react'
import { Box, Button, makeStyles, MenuItem, Select } from '@material-ui/core'
import { useTranslation } from 'react-i18next'
import { colors } from '../../styling'

type Props = {
  verificationMethod: string
  changeVerificationMethod: (e: any) => void
  nextVerificationMethod: () => void
  setShowEnableSelection: (e: any) => void
  setShowMFASelection: (e: any) => void
}

export const MFASelectMethod: React.FC<Props> = ({
  verificationMethod,
  changeVerificationMethod,
  nextVerificationMethod,
  setShowEnableSelection,
  setShowMFASelection,
}) => {
  const { t } = useTranslation()
  const css = useStyles()
  return (
    <Box mt={2}>
      <p>
        <b>Configure your Two-Factor Authentication by choosing a verification method:</b>
      </p>
      <Box mt={3}>
        <Select variant='outlined' value={verificationMethod} onChange={e => changeVerificationMethod(e.target.value)}>
          <MenuItem value="sms">{'SMS Number'}</MenuItem>
          <MenuItem value="app">{'Authenticator app'}</MenuItem>
        </Select>
      </Box>
      <Box mt={3}>
        <Button
          onClick={nextVerificationMethod}
          className={css.button}
          color='primary'
          variant="contained"
        >
          Next
        </Button>
        <Button
          onClick={() => {
            setShowEnableSelection(true)
            setShowMFASelection(false)
          }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  )
}


const useStyles = makeStyles({
  input: {
    // fontSize: 10,
    minWidth: 350,
  },
  button: {
    borderRadius: 3
  },
  subtitle: {
    margin: 0,
    padding: 0,
    color: colors.grayDark,
    fontSize: 9
  }
})