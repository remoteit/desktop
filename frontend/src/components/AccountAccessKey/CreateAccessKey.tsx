import React, { useState } from 'react'
import { Icon } from '../Icon'
import { Button, Paper, Grid, Box, Typography, Theme } from '@mui/material'
import { makeStyles, createStyles } from '@mui/styles'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { CopyButton } from '../../buttons/CopyButton'

export function CreateAccessKey(props) {
  const classes = useStyles()
  const { user } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
  }))

  const [showAccessKey, setShowAccessKey] = useState(false)

  const handleShowAccessKey = () => {
    showAccessKey ? setShowAccessKey(false) : setShowAccessKey(true)
  }

  function downloadCSV() {
    var csv = '\n'
    csv += '[default]'
    csv += '\n'
    csv += '# ' + user?.email
    csv += '\n'
    csv += 'R3_ACCESS_KEY_ID' + '=' + props.newKey
    csv += '\n'
    csv += 'R3_SECRET_ACCESS_KEY' + '=' + props.secretKey
    csv += '\n'

    var element = document.createElement('a')
    element.href = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(csv)
    element.setAttribute('download', 'remoteit-credentials')
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }
  return (
    <div className={classes.mainBox}>
      <Box display="flex" className={classes.successMessage} textAlign="left" alignItems="center" p={2}>
        <Icon fixedWidth name="check-circle" size="md" className={classes.icon} />
        <Typography>Your new access key is ready to use</Typography>
      </Box>
      <div className={classes.root}>
        <Paper className={classes.paper}>
          <Grid container wrap="nowrap" spacing={2}>
            <Grid item xs={4}>
              <Typography noWrap>Access Key ID</Typography>
            </Grid>
            <Grid item xs zeroMinWidth>
              <Typography noWrap>
                {props.newKey}
                <CopyButton icon="copy" value={props.newKey} />
              </Typography>
            </Grid>
          </Grid>
          <Grid container wrap="nowrap" spacing={2}>
            <Grid item xs={4}>
              <Typography noWrap>Secret Access key</Typography>
            </Grid>
            <Grid item xs zeroMinWidth>
              {showAccessKey ? (
                <Box>
                  <Typography noWrap>
                    {props.secretKey}
                    <CopyButton icon="copy" value={props.secretKey} />
                  </Typography>
                  <Typography
                    color="primary"
                    component="a"
                    gutterBottom
                    onClick={handleShowAccessKey}
                    className={classes.cursor}
                  >
                    Hide secret access key
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography
                    color="primary"
                    component="a"
                    gutterBottom
                    onClick={handleShowAccessKey}
                    className={classes.cursor}
                  >
                    Show secret access key
                  </Typography>
                  <CopyButton icon="copy" value={props.secretKey} />
                </Box>
              )}
            </Grid>
          </Grid>
          <Button variant="contained" className={classes.download} onClick={downloadCSV}>
            <Icon name="download" className={classes.icon} />
            Download Credentials
          </Button>
        </Paper>
      </div>
    </div>
  )
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    mainBox: {
      backgroundColor: theme.palette.grayLightest.main,
      borderRadius: 3,
      padding: 5,
    },
    root: {
      flexGrow: 1,
      overflow: 'hidden',
      padding: theme.spacing(0, 3),
    },
    paper: {
      margin: `${theme.spacing(1)} auto`,
      padding: theme.spacing(2),
      fontSize: '10px',
    },
    successMessage: {
      color: theme.palette.success.main,
      fontWeight: 500,
    },
    icon: {
      marginRight: 10,
    },
    download: {
      marginTop: 10,
    },
    cursor: {
      cursor: 'pointer',
    },
  })
)
