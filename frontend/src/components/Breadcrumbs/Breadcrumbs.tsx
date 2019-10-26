import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Tooltip, IconButton, Link } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { pageName } from '../../helpers/pageNameHelper'
import { Icon } from '../Icon'
import { LAST_PATH } from '../../helpers/regEx'
import styles from '../../styling'

export const Breadcrumbs: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const parentPath = location.pathname.replace(LAST_PATH, '')
  const crumbs = parentPath.substr(1).split('/')

  let breadcrumb: string = ''

  return (
    <div className={css.header}>
      <Tooltip title="back">
        <IconButton onClick={() => history.push(parentPath)}>
          <Icon name="chevron-left" size="md" fixedWidth />
        </IconButton>
      </Tooltip>
      {crumbs.map((crumb, index) => {
        const crumbPath = (breadcrumb += `/${crumb}`)
        return (
          <Link key={index} onClick={() => history.push(crumbPath)}>
            {pageName(crumbPath)} /
          </Link>
        )
      })}
    </div>
  )
}

const useStyles = makeStyles({
  header: {
    backgroundColor: styles.colors.grayLighter,
    '& .MuiLink-root': {
      fontFamily: 'Roboto Mono',
      color: styles.colors.grayDarker,
      fontSize: styles.fontSizes.xs,
      letterSpacing: 2,
    },
  },
})
