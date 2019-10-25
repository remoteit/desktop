import React, { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Typography, Tooltip, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import { Icon } from '../Icon'
// import styles from '../../styling'

const mapState = (state: ApplicationState) => ({
  user: state.auth.user,
  interfaces: state.jump.interfaces,
})

const mapDispatch = (dispatch: any) => ({})

type Props = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

const Component: React.FC<Props> = ({ user, interfaces }) => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const navigateUp = () => history.push(location.pathname.replace(/\/[^\/]+$/g, ''))

  return (
    <div className={css.header}>
      <h2>Services</h2>
      <Tooltip title="back">
        <IconButton onClick={navigateUp}>
          <Icon name="chevron-left" size="md" fixedWidth />
        </IconButton>
      </Tooltip>
    </div>
  )
}

export const Breadcrumbs = connect(
  mapState,
  mapDispatch
)(Component)

const useStyles = makeStyles({
  header: {},
})
