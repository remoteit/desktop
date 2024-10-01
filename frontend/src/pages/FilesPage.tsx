import React from 'react'
import { State } from '../store'
import { removeObject } from '../helpers/utilHelper'
import { useSelector } from 'react-redux'
import { ScriptingHeader } from '../components/ScriptingHeader'
import { scriptAttributes } from '../components/FileAttributes'
import { selectScripts, selectFiles } from '../selectors/scripting'
import { Typography, Stack } from '@mui/material'
import { LoadingMessage } from '../components/LoadingMessage'
import { FileList } from '../components/FileList'
import { Notice } from '../components/Notice'
import { Body } from '../components/Body'

export const FilesPage: React.FC<{ scripts?: boolean }> = ({ scripts }) => {
  const [required, attributes] = removeObject(scriptAttributes, a => a.required === true)
  const files = useSelector(scripts ? selectScripts : selectFiles)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const fetching = useSelector((state: State) => state.files.fetching)

  return (
    <ScriptingHeader>
      {fetching && !files.length ? (
        <LoadingMessage />
      ) : !files.length ? (
        <Body center>
          <Stack alignItems="center">
            <Typography variant="body2" color="gray.main" gutterBottom>
              {scripts ? 'No scripts found' : 'No files found'}
            </Typography>
            {scripts && <Notice gutterBottom>Add a script to get started</Notice>}
          </Stack>
        </Body>
      ) : (
        <FileList attributes={attributes} {...{ required, scripts: files, columnWidths, fetching }} />
      )}
    </ScriptingHeader>
  )
}
