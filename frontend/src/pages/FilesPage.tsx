import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { removeObject } from '../helpers/utilHelper'
import { State, Dispatch } from '../store'
import { ScriptingHeader } from '../components/ScriptingHeader'
import { scriptAttributes } from '../components/FileAttributes'
import { useSelector, useDispatch } from 'react-redux'
import { selectScripts, selectFiles } from '../selectors/scripting'
import { Typography, Button } from '@mui/material'
import { LoadingMessage } from '../components/LoadingMessage'
import { initialForm } from '../models/files'
import { selectRole } from '../selectors/organizations'
import { FileList } from '../components/FileList'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'
import { Link } from '../components/Link'

export const FilesPage: React.FC<{ scripts?: boolean }> = ({ scripts }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const [loading, setLoading] = useState<boolean>(false)
  const [required, attributes] = removeObject(scriptAttributes, a => a.required === true)
  const { fetching, initialized } = useSelector((state: State) => state.files)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const files = useSelector(scripts ? selectScripts : selectFiles)
  const role = useSelector(selectRole)

  const handleDemo = async () => {
    setLoading(true)
    const script = await dispatch.files.downloadDemoScript()
    dispatch.ui.set({
      scriptForm: {
        ...role,
        ...initialForm,
        name: 'Get Hostname',
        description: 'Demo script to illustrate how to get data and add it to a device',
        access: 'SELECTED',
        script,
      },
    })
    history.push('/scripting/scripts/add')
    setLoading(false)
  }

  return (
    <ScriptingHeader>
      {!initialized ? (
        <LoadingMessage />
      ) : !files.length ? (
        <Body center>
          <Button onClick={handleDemo} variant="contained" color="primary" size="medium">
            <Icon name={loading ? 'spinner-third' : 'plus'} type="solid" spin={loading} inlineLeft /> Demo Script
          </Button>
          {scripts ? (
            <>
              <Typography variant="body2" align="center" color="textSecondary" sx={{ maxWidth: 500, padding: 3 }}>
                See how easy it is to run a script with our demo script.
                <br />
                For more examples and detailed guidance,
                <Link href="https://link.remote.it/desktop/help/device-scripting">visit our documentation site.</Link>
              </Typography>
              <Typography variant="body2" align="center" color="grayDark.main" sx={{ maxWidth: 500, paddingX: 3 }}>
                Need a device to test with?
                <Link to="/add/docker" noUnderline sx={{ paddingTop: 0, paddingBottom: 0 }}>
                  <Icon name="docker" size="md" platformIcon /> Try a docker container!
                </Link>
              </Typography>
            </>
          ) : (
            <Typography variant="body2" gutterBottom>
              No files found
            </Typography>
          )}
        </Body>
      ) : (
        <FileList attributes={attributes} {...{ required, scripts: files, columnWidths, fetching }} />
      )}
    </ScriptingHeader>
  )
}
