import React, { useState, useEffect } from 'react'
import { Icon } from '../components/Icon'
import { Title } from '../components/Title'
import { Notice } from '../components/Notice'
import { Confirm } from '../components/Confirm'
import { TagEditor } from '../components/TagEditor'
import { Container } from '../components/Container'
import { ColorSelect } from '../components/ColorSelect'
import { findTagIndex } from '../helpers/utilHelper'
import { Typography, List } from '@material-ui/core'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { REGEX_TAG_SAFE } from '../shared/constants'
import { selectTags } from '../models/tags'
import { useLabel } from '../hooks/useLabel'
import analyticsHelper from '../helpers/analyticsHelper'

export const TagsPage: React.FC = () => {
  const getColor = useLabel()
  const dispatch = useDispatch<Dispatch>()
  const [confirm, setConfirm] = useState<{ tag: ITag; name: string }>()
  const { deleting, updating, creating, tags } = useSelector((state: ApplicationState) => ({
    deleting: state.tags.deleting,
    updating: state.tags.updating,
    creating: state.tags.creating,
    tags: selectTags(state),
  }))

  useEffect(() => {
    analyticsHelper.page('TagsPage')
  }, [])

  const rename = (tag: ITag, name: string) => {
    if (findTagIndex(tags, name) >= 0) {
      setConfirm({ tag, name })
    } else {
      dispatch.tags.rename({ tag, name })
    }
  }

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Tags</Title>
            <TagEditor
              createOnly
              button="plus"
              tags={tags}
              buttonProps={{ title: 'Add Tag', loading: creating, disabled: creating }}
            />
          </Typography>
        </>
      }
    >
      <List>
        {tags.map((tag, index) => (
          <InlineTextFieldSetting
            key={index}
            value={tag.name}
            color={getColor(tag.color)}
            icon={
              updating === tag.name ? (
                <Icon name="spinner-third" spin />
              ) : (
                <ColorSelect tag={tag} onSelect={color => dispatch.tags.update({ ...tag, color })} />
              )
            }
            resetValue={tag.name}
            filter={REGEX_TAG_SAFE}
            disabled={deleting === tag.name || updating === tag.name}
            warning={
              <>
                <Notice severity="danger" gutterBottom fullWidth>
                  This cannot be undone.
                </Notice>
                All devices will have this tag removed from them.
              </>
            }
            onDelete={() => dispatch.tags.delete(tag)}
            onSave={value => rename(tag, value.toString())}
          />
        ))}
      </List>
      <Confirm
        open={!!confirm}
        onConfirm={() => {
          confirm && dispatch.tags.rename(confirm)
          setConfirm(undefined)
        }}
        onDeny={() => setConfirm(undefined)}
        title="Merge tags?"
        action="Merge"
      >
        <Notice severity="warning" gutterBottom fullWidth>
          This cannot be undone.
        </Notice>
        <Typography variant="body2">
          You are about merge all instances of the <i>{confirm?.tag.name}</i> tag into the
          <b> {confirm?.name}</b> tag.
        </Typography>
      </Confirm>
    </Container>
  )
}
