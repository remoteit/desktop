import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Typography, Link } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const DocsLinks: React.FC<{ os?: Ios }> = ({ os }) => {
  const css = useStyles()
  return (
    <section className={css.links}>
      <Typography variant="body2" align="center" gutterBottom>
        See how to:
      </Typography>
      <Link href={`https://link.remote.it/documentation-desktop/overview`} target="_blank">
        Use remote.it Desktop
        <Icon rotate={-45} name="arrow-right" size="sm" type="regular" />
      </Link>
      <Link href={`https://link.remote.it/documentation-desktop/${os}-connections`} target="_blank">
        Connect to this device from anywhere
        <Icon rotate={-45} name="arrow-right" size="sm" type="regular" />
      </Link>
      <Link href={`https://link.remote.it/documentation-minecraft/overview`} target="_blank">
        Host a Minecraft server with remote.it
        <Icon rotate={-45} name="arrow-right" size="sm" type="regular" />
      </Link>
    </section>
  )
}

const useStyles = makeStyles({
  links: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    '& svg': { paddingLeft: 5, marginLeft: 3 },
  },
})
