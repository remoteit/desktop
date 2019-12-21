import React from 'react'
import { Icon } from '../../components/Icon'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'

export const NextButton: React.FC = () => {
  const css = useStyles()
  return (
    <span className={css.styles}>
      <Icon name="chevron-right" size="md" fixedWidth />
    </span>
  )
}

const useStyles = makeStyles({
  styles: {
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    position: 'absolute',
    right: spacing.md,
  },
})
