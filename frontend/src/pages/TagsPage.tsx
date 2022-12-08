import React, { useState } from 'react'
import { Icon } from '../components/Icon'
import { Title } from '../components/Title'
import { Notice } from '../components/Notice'
import { Confirm } from '../components/Confirm'
import { TagEditor } from '../components/TagEditor'
import { Container } from '../components/Container'
import { ColorSelect } from '../components/ColorSelect'
import { findTagIndex } from '../helpers/utilHelper'
import { Typography, List } from '@mui/material'
import { getActiveAccountId } from '../selectors/accounts'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { canEditTags } from '../models/tags'
import { selectTags } from '../selectors/tags'
import { REGEX_TAG_SAFE } from '../shared/constants'
import { useLabel } from '../hooks/useLabel'

export const TagsPage: React.FC = () => {
  const getColor = useLabel()
  const dispatch = useDispatch<Dispatch>()
  const [confirm, setConfirm] = useState<{ tag: ITag; name: string }>()
  const { accountId, deleting, updating, creating, canEdit, tags } = useSelector((state: ApplicationState) => {
    const accountId = getActiveAccountId(state)
    return {
      accountId,
      deleting: state.tags.deleting,
      updating: state.tags.updating,
      creating: state.tags.creating,
      canEdit: canEditTags(state, accountId),
      tags: selectTags(state),
    }
  })

  const rename = (tag: ITag, name: string) => {
    if (findTagIndex(tags, name) >= 0) {
      setConfirm({ tag, name })
    } else {
      dispatch.tags.rename({ tag, name, accountId })
    }
  }

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1" gutterBottom>
            <Title>Tags</Title>
            {canEdit && (
              <TagEditor
                createOnly
                button="plus"
                tags={tags}
                buttonProps={{ title: 'Add Tag', loading: creating, disabled: creating }}
                onCreate={async tag => await dispatch.tags.create({ tag, accountId })}
              />
            )}
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
                <ColorSelect
                  tag={tag}
                  onSelect={color => dispatch.tags.update({ tag: { ...tag, color }, accountId })}
                />
              )
            }
            resetValue={tag.name}
            filter={REGEX_TAG_SAFE}
            disabled={!canEdit || deleting === tag.name || updating === tag.name}
            warning={
              <>
                <Notice severity="error" gutterBottom fullWidth>
                  You are deleting the tag&nbsp;
                  <i>
                    <b>{tag.name}</b>
                  </i>
                  <br />
                  This cannot be undone.
                </Notice>
                All devices will have this tag removed from them.
              </>
            }
            onDelete={() => dispatch.tags.delete({ tag, accountId })}
            onSave={value => rename(tag, value.toString())}
          />
        ))}
      </List>
      <Confirm
        open={!!confirm}
        onConfirm={() => {
          confirm && dispatch.tags.rename({ ...confirm, accountId })
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
