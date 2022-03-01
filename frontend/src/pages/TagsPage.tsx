import React, { useEffect } from 'react'
import { Icon } from '../components/Icon'
import { Title } from '../components/Title'
import { TagEditor } from '../components/TagEditor'
import { Container } from '../components/Container'
import { ColorSelect } from '../components/ColorSelect'
import { Typography, List } from '@material-ui/core'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { REGEX_TAG_SAFE } from '../shared/constants'
import { useLabel } from '../hooks/useLabel'
import analyticsHelper from '../helpers/analyticsHelper'

export const TagsPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const getColor = useLabel()
  const { removing, updating, tags } = useSelector((state: ApplicationState) => ({
    removing: state.tags.removing,
    updating: state.tags.updating,
    tags: state.tags.all,
  }))

  useEffect(() => {
    analyticsHelper.page('TagsPage')
  }, [])

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Tags</Title>
            <TagEditor button="plus" />
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
            disabled={removing === tag.name || updating === tag.name}
            warning="This can not be undone. All devices will have this tag removed from them."
            onDelete={() => dispatch.tags.delete(tag)}
            onSave={value => dispatch.tags.rename({ tag, name: value.toString() })}
          />
        ))}
      </List>
    </Container>
  )
}
