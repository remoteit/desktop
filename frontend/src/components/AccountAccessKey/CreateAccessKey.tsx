import React, { useState } from 'react'
import { Icon } from '../Icon'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'
import { State } from '../../store'
import { useSelector } from 'react-redux'
import { CopyCodeBlock } from '../CopyCodeBlock'
import { IconButton } from '../../buttons/IconButton'
import { Notice } from '../Notice'

type Props = {
  open: boolean
  onClose: () => void
  newKey?: string
  secretKey?: string
}

export function CreateAccessKey({ open, onClose, newKey = 'Creating...', secretKey }: Props) {
  const user = useSelector((state: State) => state.auth.user)
  const [showAccessKey, setShowAccessKey] = useState(false)
  const handleShowAccessKey = () => setShowAccessKey(!showAccessKey)

  function downloadCredentials() {
    var data = `[DEFAULT]
# ${user?.email}
R3_ACCESS_KEY_ID=${newKey}
R3_SECRET_ACCESS_KEY=${secretKey}`

    var element = document.createElement('a')
    element.href = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(data)
    element.setAttribute('download', 'credentials')
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Credentials</DialogTitle>
      <DialogContent>
        {secretKey && (
          <Notice severity="success" fullWidth gutterBottom>
            Your new access key is ready to use
          </Notice>
        )}
        <Typography variant="body2" gutterBottom>
          You will not see this secret key again. Please download and save it in the .remoteit directory of your home
          folder.
        </Typography>
        <CopyCodeBlock label="Access Key ID" value={newKey} hideCopyLabel />
        <CopyCodeBlock
          label="Secret Access key"
          value={secretKey}
          display={
            <>
              <IconButton
                name={showAccessKey ? 'eye' : 'eye-slash'}
                size="xxs"
                type="solid"
                buttonBaseSize="small"
                onClick={handleShowAccessKey}
              />
              {showAccessKey ? secretKey : '****************************************'}
            </>
          }
          sx={{ marginTop: 1 }}
          hideCopyLabel
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
        <Button variant="contained" onClick={downloadCredentials} startIcon={<Icon name="download" />}>
          &nbsp; Download &nbsp;
        </Button>
      </DialogActions>
    </Dialog>
  )
}
