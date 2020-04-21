import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { Typography, Link } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const DocsLinks: React.FC<{ os?: Ios }> = ({ os }) => {
  const css = useStyles()
  return (
    <section className={css.links}>
      <Typography variant="body2" align="center" gutterBottom>
        See how to:
      </Typography>
      <Link href={`https://docs.remote.it/desktop-welcome`} target="_blank">
        Use remote.it Desktop
        <Icon className={css.rotate} name="arrow-right" size="sm" weight="regular" />
      </Link>
      <Link href={`https://docs.remote.it/connect-${os}`} target="_blank">
        Connect to this device from anywhere
        <Icon className={css.rotate} name="arrow-right" size="sm" weight="regular" />
      </Link>
      <Link href={`https://docs.remote.it/minecraft`} target="_blank">
        Host a Minecraft server with remote.it
        <Icon className={css.rotate} name="arrow-right" size="sm" weight="regular" />
      </Link>
    </section>
  )
}

const useStyles = makeStyles({
  rotate: { transform: 'rotate(-45deg)', paddingLeft: 5, marginLeft: 3 },
  links: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
})
