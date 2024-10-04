import React, { useEffect } from 'react'
import { selectJobs } from '../selectors/scripting'
import { removeObject } from '../helpers/utilHelper'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { selectActiveAccountId } from '../selectors/accounts'
import { Typography, Stack } from '@mui/material'
import { ScriptingHeader } from '../components/ScriptingHeader'
import { LoadingMessage } from '../components/LoadingMessage'
import { jobAttributes } from '../components/JobAttributes'
import { JobList } from '../components/JobList'
import { Notice } from '../components/Notice'
import { Body } from '../components/Body'

export const JobsPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const [required, attributes] = removeObject(jobAttributes, a => a.required === true)
  const jobs = useSelector(selectJobs)
  const accountId = useSelector(selectActiveAccountId)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const fetching = useSelector((state: State) => state.ui.fetching || state.jobs.fetching)

  useEffect(() => {
    dispatch.jobs.fetchIfEmpty()
  }, [accountId])

  return (
    <ScriptingHeader>
      {fetching && !jobs.length ? (
        <LoadingMessage />
      ) : !jobs.length ? (
        <Body center>
          <Stack alignItems="center">
            <Typography variant="body2" color="gray.main" gutterBottom>
              No runs found
            </Typography>
            <Notice gutterBottom>Run a script to get started</Notice>
          </Stack>
        </Body>
      ) : (
        <JobList attributes={attributes} {...{ required, jobs, columnWidths, fetching }} />
      )}
    </ScriptingHeader>
  )
}
