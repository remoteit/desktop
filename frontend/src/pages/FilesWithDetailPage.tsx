import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { selectFile } from '../selectors/scripting'
import { useContainerWidth } from '../hooks/useContainerWidth'
import { useResizablePanel } from '../hooks/useResizablePanel'
import { FilesPage } from './FilesPage'
import { FileDetailPage } from './FileDetailPage'
import { Stack } from '@mui/material'

export const FilesWithDetailPage: React.FC = () => {
  const { fileID } = useParams<{ fileID: string }>()
  const file = useSelector((state: State) => selectFile(state, undefined, fileID))
  
  const { containerRef, containerWidth } = useContainerWidth()
  const panel1 = useResizablePanel(400, containerRef, { minWidth: 200 })

  // Determine how many panels to show based on width
  const maxPanels = containerWidth > 900 ? 2 : 1

  // Show file details when a file is selected
  const showPanel1 = maxPanels >= 1
  const showPanel2 = maxPanels >= 2 && !!fileID

  return (
    <Stack ref={containerRef} direction="row" sx={{ height: '100%', width: '100%' }}>
      {/* Panel 1: Files List */}
      {showPanel1 && (
        <Stack sx={{ width: showPanel2 ? panel1.width : '100%', minWidth: 200 }}>
          <FilesPage showHeader />
        </Stack>
      )}

      {/* Panel 2: File Details */}
      {showPanel2 && (
        <Stack sx={{ flex: 1, minWidth: 200 }}>
          <FileDetailPage />
        </Stack>
      )}
    </Stack>
  )
}
