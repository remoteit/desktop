import React, { useEffect } from 'react'
import { LANGUAGES } from '../shared/constants'
import { Dispatch, ApplicationState } from '../store'
import { makeStyles, Typography, List, TextField, MenuItem, ListItem, ListItemIcon, Link } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { DeleteAccountSection } from '../components/DeleteAccountSection'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { spacing } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

export const ProfilePage: React.FC = () => {
  const { user } = useSelector((state: ApplicationState) => state.auth)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  useEffect(() => {
    analyticsHelper.page('OverviewPage')
  }, [])

  if (!user) return null

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Profile</Title>
          </Typography>
        </>
      }
    >
      <Gutters top="xl" className={css.profile}>
        <Avatar email={user.email} size={125} />
        <Typography variant="caption">
          Your profile picture is imported from the free service Gravatar.
          <br /> To edit or add a profile image please visit<Link href="https://gravatar.com">gravatar.com.</Link>
        </Typography>
      </Gutters>
      <List>
        <InlineTextFieldSetting icon="at" value={user.email} label="EMAIL" disabled={true} />
        <ListItem dense className={css.field} button>
          <ListItemIcon>
            <Icon name="language" fixedWidth />
          </ListItemIcon>
          <TextField
            select
            fullWidth
            label="Email Language"
            value={user?.language}
            onChange={e => dispatch.user.changeLanguage(e.target.value)}
          >
            <MenuItem value="en">{LANGUAGES.en}</MenuItem>
            <MenuItem value="ja">{LANGUAGES.ja}</MenuItem>
          </TextField>
        </ListItem>
        <AccordionMenuItem subtitle="Account deletion" gutters>
          <DeleteAccountSection email={user.email} paidPlan={false} />
        </AccordionMenuItem>
      </List>
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  profile: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 500,
    '& .MuiAvatar-root': { marginRight: spacing.xl },
  },
  menu: { textTransform: 'capitalize' },
  indent: { marginRight: -spacing.lg },
  field: { '&:hover': { backgroundColor: palette.primaryHighlight.main } },
}))
