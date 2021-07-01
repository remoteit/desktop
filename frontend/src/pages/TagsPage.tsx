import React, { useEffect } from 'react'
import { Tag } from '../components/Tag'
import { Title } from '../components/Title'
import { TagEditor } from '../components/TagEditor'
import { Container } from '../components/Container'
import { Typography, List } from '@material-ui/core'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { REGEX_TAG_SAFE } from '../shared/constants'
import analyticsHelper from '../helpers/analyticsHelper'

export const TagsPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { labels, tags } = useSelector((state: ApplicationState) => ({
    labels: state.labels,
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
            <TagEditor button />
          </Typography>
        </>
      }
    >
      <List>
        {tags.map((tag, index) => (
          <InlineTextFieldSetting
            key={index}
            value={tag.name}
            icon={<Tag dot tag={tag} labels={labels} />}
            resetValue={tag.name}
            filter={REGEX_TAG_SAFE}
            warning="This can not be undone. All devices will have this tag removed from them."
            onDelete={() => {
              tags.splice(index, 1)
              dispatch.tags.set({ tags })
            }}
            onSave={value => {
              tags[index].name = value.toString()
              dispatch.tags.set({ tags })
            }}
          />
        ))}
      </List>
    </Container>
  )
}
