import React from 'react'
import { makeStyles, Typography, InputLabel, Collapse, Paper, IconButton, Menu, MenuItem, Grid, Popper, Grow, ClickAwayListener, MenuList, withStyles, MenuProps, ListItemText } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { getAttributes } from '../helpers/attributes'
import { LaunchButton } from '../buttons/LaunchButton'
import { useApplication } from '../hooks/useApplication'
import { DataDisplay } from './DataDisplay'
import { GuideStep } from './GuideStep'
import { Gutters } from './Gutters'
import { colors, spacing } from '../styling'
import { Icon } from './Icon'

const StyledMenu = withStyles({
  paper: {
    border: '1px solid #d3d4d5',
  },
})((props: MenuProps) => (
  <Menu
    elevation={0}
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
))

type Props = {
  connection?: IConnection
  service?: IService
  session?: ISession
  details?: boolean
  show?: boolean
}

export const ConnectionDetails: React.FC<Props> = ({ details, show, connection, service, session }) => {
  const attributes = getAttributes(['lanShare', 'connection', 'duration', 'location', 'initiatorPlatform'])
  const [hover, setHover] = React.useState<'name' | 'port' | 'copy' | 'launch' | undefined>()
  const { ui } = useDispatch<Dispatch>()
  const app = useApplication('copy', service, connection)
  const css = useStyles()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!connection) return null

  const address = app.address.split(':')
  const name = address[0]
  const port = address[1]
  let h2Css = css.h2
  let label = 'Address'
  let display: JSX.Element | string = (
    <>
      {name && <span className={hover === 'name' ? css.active : undefined}>{name}</span>}
      {port && (
        <>
          :<span className={hover === 'port' ? css.active : undefined}>{port}</span>
        </>
      )}
    </>
  )

  if (hover === 'launch' || hover === 'copy') {
    label = hover === 'copy' ? 'Command' : 'Launch'
    app.context = hover
    display = app.command
    h2Css += ' ' + css.active
  }

  const copy = (text: any) => {
    navigator.clipboard.writeText(text)
    handleClose()
  }

  return (
    <Collapse in={show} timeout={800}>
      <Gutters bottom={null}>
        <Paper className={css.address} elevation={0}>
          <Gutters size="md" bottom={null}>
            <Grid container>
              <Grid item xs={8} md={8}>
                <InputLabel shrink>{label}</InputLabel>
                <Typography variant="h2" className={h2Css}>
                  {display}
                </Typography>
              </Grid>
              <Grid item xs={4} md={4} style={{ textAlign: 'right' }}>
                <GuideStep
                  guide="guideAWS"
                  step={7}
                  instructions="Or for web and some other services you can use the launch button."
                  placement="left"
                  highlight
                >
                  <LaunchButton
                    color="white"
                    type="solid"
                    size="md"
                    connection={connection}
                    service={service}
                    onLaunch={() => ui.guide({ guide: 'guideAWS', step: 0, done: true })}
                    onMouseEnter={() => setHover('launch')}
                    onMouseLeave={() => setHover(undefined)}
                  />
                </GuideStep>
                <GuideStep
                  guide="guideAWS"
                  step={6}
                  instructions="Copy this address for use in your application to have it connect on demand."
                  placement="left"
                  highlight
                >
                  <IconButton onClick={handleClick} style={{ color: 'white' }}>
                    <Icon name="copy" size="md"></Icon>
                  </IconButton>
                  <StyledMenu
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onMouseEnter={() => setHover('copy')} onMouseLeave={() => setHover(undefined)} onClick={() => copy(app.command)} >Copy launch address</MenuItem>
                    <MenuItem value={connection.host} onMouseEnter={() => setHover('name')} onMouseLeave={() => setHover(undefined)} onClick={() => copy(connection.host)} >Copy Hostname </MenuItem>
                    <MenuItem value={connection.port} onMouseEnter={() => setHover('port')} onMouseLeave={() => setHover(undefined)} onClick={() => copy(connection.port)} >Copy Port </MenuItem>

                  </StyledMenu>
                </GuideStep>
              </Grid>
            </Grid>



          </Gutters>
        </Paper>
        {details && (
          <Gutters size={null} bottom="xs">
            <DataDisplay attributes={attributes} connection={connection} session={session} width={100} disablePadding />
          </Gutters>
        )}
      </Gutters>
    </Collapse>
  )
}

const useStyles = makeStyles({
  active: {
    borderRadius: 4,
    backgroundColor: colors.darken,
  },
  h2: {
    wordBreak: 'break-all',
    overflow: 'hidden',
    fontWeight: 500,
    lineHeight: '1.33em',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    transition: 'height 200ms',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
    '& span': { wordBreak: 'break-word' },
  },
  address: {
    backgroundColor: colors.primary,
    color: colors.white,
    padding: spacing.xs,
    '& label': { color: colors.white },
  },
  buttons: {
    display: 'flex',
    justifyContent: 'space-between',
  },
})