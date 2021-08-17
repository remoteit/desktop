import React from 'react'
import { Breadcrumbs, makeStyles } from '@material-ui/core'


export const Breadcrumb: React.FC = () => {
  const css = useStyles()
 
  return (
    <Breadcrumbs className={css.breadcrumb} aria-label="breadcrumb"></Breadcrumbs>
  )
}

const useStyles = makeStyles({
  breadcrumb: {
       display: 'flex',
       width: '100%',
       height: 60,
     
    },
  })
