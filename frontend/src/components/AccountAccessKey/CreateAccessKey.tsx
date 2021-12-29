import React, { useState } from 'react'
import IconButton from '@material-ui/core/IconButton'
import Button from '@material-ui/core/Button'
import { Icon } from '../Icon'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles'
import classnames from 'classnames'

import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { CopyButton } from '../../buttons/CopyButton'
import { Box, Typography } from '@material-ui/core'



export function CreateAccessKey({ ...props }) {
  const classes = useStyles()
  const { user } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
  }))

  const [showAccessKey, setShowAccessKey] = useState(false)

  const onClose = () => {
    props.closePanel()
  }

  const handleShowAccessKey = () => {
    showAccessKey ? setShowAccessKey(false) : setShowAccessKey(true)
  }

  function downloadCSV() {
    var csv = '\n'
    csv += '[default]'
    csv += '\n'
    csv += '\# ' + user?.email
    csv += '\n'
    csv += 'R3_ACCESS_KEY_ID' + '=' + props.accessKey
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
    <>
      {props.showSection ? (
        <div
          className={classnames(
            'bg-gray-lightest py-sm my-sm',
            classes.mainBox
          )}
        >
          <Box
            display="flex"
            className="w-100 success"
            textAlign="left"
            alignItems="center"
          >
            <Icon
              fixedWidth
              name="check-circle"
              className="success ml-md txt-xl"
              size='lg'
            />
            <Typography className="f-1 txt-md pl-sm fw-bold w-90">
              Your new access key is ready to use
            </Typography>
            <IconButton aria-label="close" onClick={onClose}>
              <Icon name='times' />
            </IconButton>
          </Box>

          <div className={classes.root}>
            <Paper className={classes.paper}>
              <Grid container wrap="nowrap" spacing={2}>
                <Grid item xs={4}>
                  <Typography noWrap>Access Key ID</Typography>
                </Grid>
                <Grid item xs zeroMinWidth>
                  <Typography noWrap>
                    {props.accessKey}
                    <CopyButton icon='copy' value={props.accessKey} />
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
                        <CopyButton icon='copy' value={props.secretKey} />
                      </Typography>

                      <Typography
                        color="primary"
                        component="a"
                        gutterBottom
                        onClick={handleShowAccessKey}
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
                      >
                        Show secret access key
                      </Typography>
                      <CopyButton icon='copy' value={props.secretKey} />
                    </Box>
                  )}
                </Grid>
              </Grid>
              <Button
                variant="contained"
                className="mt-sm"
                onClick={downloadCSV}
              >
                <Icon name="download" className="mr-sm" />
                Download CREDENTIALS
              </Button>
            </Paper>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  )
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    mainBox: {
      width: 650,
    },
    root: {
      flexGrow: 1,
      overflow: 'hidden',
      padding: theme.spacing(0, 3),
    },
    paper: {
      maxWidth: 650,
      margin: `${theme.spacing(1)}px auto`,
      padding: theme.spacing(2),
      fontSize: '10px',
    },
  })
)