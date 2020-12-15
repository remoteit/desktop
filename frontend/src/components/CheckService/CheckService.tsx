import React from 'react'
import { makeStyles } from '@material-ui/core'
import { Icon } from '../Icon'

type Props = {
  isValid?: boolean
  loading?: boolean
}

export const CheckService: React.FC<Props> = ({ isValid, loading }) => {
  const css = useStyles()
  let icon = isValid ? 'check-circle' : 'minus-circle'
  if (loading) icon = 'spinner-third'

  return (
    <div className={css.service}>
      <Icon name={icon} type="light" size="md" color={isValid ? 'success' : 'gray'} spin={loading} fixedWidth />
    </div>
  )
}

const useStyles = makeStyles({
  service: {
    width: 70,
    position: 'relative',
    '& > div': { position: 'absolute', width: '100%' },
    '& > div:last-child': { position: 'relative' },
  },
})
