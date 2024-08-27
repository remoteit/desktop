import React from 'react'
import { selectScript } from '../selectors/scripting'
import { getJobAttribute } from '../components/JobAttributes'
import { Dispatch, State } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { useDispatch, useSelector } from 'react-redux'
import { Redirect, useLocation, useHistory, useParams } from 'react-router-dom'
import {
  Box,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
} from '@mui/material'
import { LinearProgress } from '../components/LinearProgress'
import { Container } from '../components/Container'
import { fontSizes } from '../styling'
import { Duration } from '../components/Duration'
import { Title } from '../components/Title'
import { Tags } from '../components/Tags'

export const ScriptPage: React.FC = () => {
  const { fileID } = useParams<{ fileID?: string }>()
  const script = useSelector((state: State) => selectScript(state, undefined, fileID))
  const fetching = useSelector((state: State) => state.files.fetching)
  // const dispatch = useDispatch<Dispatch>()
  // const location = useLocation()
  // const history = useHistory()

  const successIcon = getJobAttribute('jobDeviceSuccess').label
  const failureIcon = getJobAttribute('jobDeviceFailure').label
  const countIcon = getJobAttribute('jobDeviceCount').label

  if (!script) return <Redirect to={{ pathname: '/scripting/scripts', state: { isRedirect: true } }} />

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <List>
            <ListItemLocation
              to={`/scripting/scripts/${fileID}/details`}
              match={[`/scripting/scripts/${fileID}/details`, `/scripting/scripts/${fileID}/edit`]}
              title={<Typography variant="h2">{script.name}</Typography>}
              icon="scripting"
              exactMatch
            ></ListItemLocation>
            <Typography marginLeft={9.5} variant="caption" component="p">
              {getJobAttribute('jobUpdated').value({ job: script.job })}
            </Typography>
            <Box marginY={2} marginLeft={9} marginRight={3}>
              {getJobAttribute('jobTags').value({ job: script.job })}
            </Box>
            {script.shortDesc && (
              <Typography marginLeft={9.5} marginTop={5} marginBottom={3} variant="body2" component="p">
                {script.shortDesc}
              </Typography>
            )}
          </List>
          <LinearProgress loading={fetching} />
        </>
      }
    >
      <Box sx={{ marginRight: 2 }}>
        <Typography variant="subtitle1">
          <Title>Devices</Title>
          <Stack direction="row" spacing={1}>
            <Typography variant="caption" paddingLeft={2}>
              {script.job?.jobDevices.length || '-'}
            </Typography>
            {countIcon}
            <Typography variant="caption" paddingLeft={2}>
              {script.job?.jobDevices.filter(d => d.status === 'SUCCESS').length || '-'}
            </Typography>
            {successIcon}
            <Typography variant="caption" paddingLeft={2}>
              {script.job?.jobDevices.filter(d => d.status === 'FAILED' || d.status === 'CANCELLED').length || '-'}
            </Typography>
            {failureIcon}
          </Stack>
        </Typography>
        <List>
          {script.job?.jobDevices.map((d, i) => (
            <ListItem key={i}>
              <ListItemIcon>
                {d.status === 'SUCCESS' ? (
                  successIcon
                ) : d.status === 'FAILED' || d.status === 'CANCELLED' ? (
                  failureIcon
                ) : d.status === 'RUNNING' || d.status === 'WAITING' ? (
                  <CircularProgress color="primary" size={fontSizes.md} />
                ) : (
                  countIcon
                )}
              </ListItemIcon>
              <ListItemText primary={d.device.name} />
              <Typography variant="caption">
                <Duration startDate={new Date(d.updated)} />
              </Typography>
            </ListItem>
          ))}
        </List>
      </Box>
    </Container>
  )
}
