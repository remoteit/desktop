import React from 'react'
import { makeStyles, Box, Typography, Collapse } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { getSelectedTags } from '../helpers/selectedHelper'
import { useHistory } from 'react-router-dom'
import { TagEditor } from './TagEditor'
import { Title } from './Title'
import { Container } from './Container'
import { IconButton } from '../buttons/IconButton'
import { spacing, radius } from '../styling'

type Props = { select?: boolean; selected: IDevice['id'][]; devices?: IDevice[] }

export const DeviceActionsBar: React.FC<Props> = ({ select, selected = [], devices, children }) => {
  const { tags, adding, removing } = useSelector((state: ApplicationState) => ({
    tags: state.tags.all,
    adding: state.tags.adding,
    removing: state.tags.removing,
  }))
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()
  return (
    <Container
      integrated
      gutterBottom
      header={
        <Collapse in={!!(select || selected.length)} timeout={400}>
          <Box className={css.actions}>
            <Title>
              <Typography variant="subtitle1">{selected.length} Selected</Typography>
            </Title>
            <TagEditor
              button="tag-add"
              tags={tags}
              buttonProps={{ title: 'Add Tag', color: 'alwaysWhite', loading: adding, disabled: adding }}
              onSelect={tag => dispatch.tags.addSelected({ tag, selected })}
            />
            <TagEditor
              allowAdding={false}
              tags={getSelectedTags(devices, selected)}
              button="tag-remove"
              buttonProps={{ title: 'Remove Tag', color: 'alwaysWhite', loading: removing, disabled: removing }}
              onSelect={tag => dispatch.tags.removeSelected({ tag, selected })}
            />
            <IconButton
              icon="times"
              title="Clear selection"
              color="alwaysWhite"
              onClick={() => {
                dispatch.ui.set({ selected: [] })
                history.push('/devices')
              }}
            />
          </Box>
        </Collapse>
      }
    >
      {children}
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: `1px solid ${palette.white.main}`,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: palette.primary.main,
    borderRadius: radius,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
    paddingRight: spacing.sm,
    '& .MuiTypography-root': {
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      fontWeight: 800,
      color: palette.alwaysWhite.main,
    },
  },
}))
