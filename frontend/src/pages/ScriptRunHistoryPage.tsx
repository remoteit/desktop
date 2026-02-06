import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Stack, Typography, useMediaQuery } from '@mui/material'
import { HIDE_SIDEBAR_WIDTH } from '../constants'
import { selectScript, selectJobs } from '../selectors/scripting'
import { JobAttribute, jobAttributes } from '../components/JobAttributes'
import { LoadingMessage } from '../components/LoadingMessage'
import { State, Dispatch } from '../store'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { JobList } from '../components/JobList'
import { Notice } from '../components/Notice'
import { Gutters } from '../components/Gutters'
import { Body } from '../components/Body'

type Props = {
  showBack?: boolean
  showMenu?: boolean
  prepared?: boolean
}

export const ScriptRunHistoryPage: React.FC<Props> = ({ showBack, showMenu, prepared }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { fileID } = useParams<{ fileID: string }>()
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)

  const script = useSelector((state: State) => selectScript(state, undefined, fileID))
  const jobs = useSelector(selectJobs).filter(j =>
    j.file?.id === fileID && (prepared ? j.status === 'READY' : j.status !== 'READY')
  )
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const fetching = useSelector((state: State) => state.ui.fetching || state.jobs.fetching)

  // Filter out the Name column (not needed since we're already filtered to one script)
  // Use a minimal spacer as the required/sticky column (just holds the status icon)
  const required = new JobAttribute({ id: 'historyIcon', label: '', defaultWidth: 20, value: () => null })
  const attributes = jobAttributes.filter(a => a.id !== 'jobName' && !a.required)

  // Load jobs if not already loaded
  useEffect(() => {
    if (!jobs.length && !fetching && script) {
      dispatch.jobs.fetchByFileIds({ fileIds: [script.id] })
    }
  }, [script])

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <Gutters top="sm" bottom="sm">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showMenu && sidebarHidden && (
              <IconButton
                name="bars"
                size="md"
                color="grayDarker"
                onClick={() => dispatch.ui.set({ sidebarMenu: true })}
              />
            )}
            {showBack && (
              <IconButton
                name="chevron-left"
                onClick={() => history.push(`/script/${fileID}`)}
                size="md"
                title="Back"
              />
            )}
            <Typography variant="h3" sx={{ flex: 1 }}>
              {prepared ? 'Prepared Runs' : 'Run History'}
            </Typography>
          </Box>
        </Gutters>
      }
    >
      {fetching && !jobs.length ? (
        <LoadingMessage />
      ) : !jobs.length ? (
        <Body center>
          <Stack alignItems="center">
            <Notice gutterBottom>{prepared ? 'No prepared runs.' : 'This script has not been run yet.'}</Notice>
          </Stack>
        </Body>
      ) : (
        <JobList attributes={attributes} {...{ required, jobs, columnWidths, fetching }} />
      )}
    </Container>
  )
}
