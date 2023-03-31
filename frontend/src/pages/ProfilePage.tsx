import React from 'react'
import { LANGUAGES } from '../shared/constants'
import { Dispatch, ApplicationState } from '../store'
import { makeStyles } from '@mui/styles'
import { isPersonal } from '../models/plans'
import { Typography, List, TextField, MenuItem, ListItem, ListItemIcon } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { DeleteAccountSection } from '../components/DeleteAccountSection'
import { FormDisplay } from '../components/FormDisplay'
import { Timestamp } from '../components/Timestamp'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { Link } from '../components/Link'
import { spacing } from '../styling'

export const ProfilePage: React.FC = () => {
  const { paidPlan, user, deleteAccount } = useSelector((state: ApplicationState) => ({
    user: state.user,
    paidPlan: !isPersonal(state),
    deleteAccount: state.ui.deleteAccount,
  }))
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

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
        <FormDisplay icon={<Icon name="at" />} label="Email" displayValue={user.email} displayOnly />
        <FormDisplay
          icon={<Icon name="calendar-star" />}
          label="Member since"
          displayValue={<Timestamp startDate={user.created} />}
          displayOnly
        />
        <ListItem dense className={css.field} button>
          <ListItemIcon>
            <Icon name="language" fixedWidth />
          </ListItemIcon>
          <TextField
            select
            fullWidth
            variant="standard"
            label="Email Language"
            value={user?.language}
            onChange={e => dispatch.user.changeLanguage(e.target.value)}
          >
            <MenuItem value="en">{LANGUAGES.en}</MenuItem>
            <MenuItem value="ja">{LANGUAGES.ja}</MenuItem>
          </TextField>
        </ListItem>
      </List>
      <Typography variant="subtitle1">Account deletion</Typography>
      <DeleteAccountSection user={user} paidPlan={paidPlan} deleteAccount={deleteAccount} />
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
  field: { marginBottom: spacing.lg, '&:hover': { backgroundColor: palette.primaryHighlight.main } },
}))
