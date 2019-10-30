import React from 'react'
import { Icon } from '../Icon'
import { makeStyles } from '@material-ui/styles'
import styles from '../../styling'

export const NextButton: React.FC = () => {
  const css = useStyles()
  return (
    <span className={css.styles}>
      <Icon name="chevron-right" size="md" fixedWidth />
    </span>
  )
}

const useStyles = makeStyles({ styles: { paddingLeft: styles.spacing.sm, paddingRight: styles.spacing.sm } })
