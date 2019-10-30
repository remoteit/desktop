import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Tooltip, IconButton, Link } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { pageName } from '../../helpers/pageNameHelper'
import { Icon } from '../Icon'
import { IDevice } from 'remote.it'
import { LAST_PATH } from '../../helpers/regEx'
import styles from '../../styling'

export const Breadcrumbs: React.FC<{ device?: IDevice }> = ({ device }) => {
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
        const name = device && crumb === device.id ? device.name : pageName(crumbPath)
        let result = []

        if (index > 0) result.push(<Icon key={crumbPath + 'Icon'} name="chevron-left" size="xxs" fixedWidth />)
        result.push(
          <Link key={crumbPath} onClick={() => history.push(crumbPath)}>
            {name}
          </Link>
        )
        return result
      })}
    </div>
  )
}

const useStyles = makeStyles({
  header: {
    backgroundColor: styles.colors.grayLighter,
    borderBottom: `1px solid ${styles.colors.grayLight}`,
    '& .MuiLink-root': {
      fontFamily: 'Roboto Mono',
      color: styles.colors.grayDarker,
      fontSize: styles.fontSizes.xs,
      letterSpacing: 2,
    },
  },
})
