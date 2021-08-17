import { makeStyles } from '@material-ui/core'
import React from 'react'
import remote_logo from '../../../assets/remote_logo_abb.svg'

export function Header() {
  const css = useStyles()
  return (
      
    <header className={css.bHeaderA}>
      <div className={css.container}>
        <div className={css.row}>
          <div className={css.col}>
            <img src={remote_logo} alt="remote.it logo" />
          </div>
        </div>     
      </div>
    </header>

  )
}


const useStyles = makeStyles({
  bHeaderA : {
    zIndex: 3,
    position: 'relative',
    width: '100%',
    backgroundColor: 'transparent',
    padding: '1.5rem 0 0',
    transition: 'background-color .3s ease-in-out',
  },
  container: {
    margin: '0 auto',
    paddingRight: '1em',
    paddingLeft: '1em',
    maxWidth: '90%'
  },
  row: {
    display: 'flex',
    flex: '0 1 auto',
    flexWrap: 'wrap',
    marginRight: '-1rem',
    marginLeft: '-1rem'
  },
  col: {
    flex: '0 0 100%',
    maxWidth: '100%',
    position: 'relative',
    minHeight: 1,
    paddingRight: '1rem',
    paddingLeft: '1rem',
    transition: '0.3s',
  }
})
