import React from 'react'
import { TagAutocomplete } from 'remoteit-desktop-frontend'

// ITag = { name: string; color: ILabel['id']; created?: Date }
// Label ids: 1 gray, 2 red, 3 orange, 4 yellow, 5 lime, 6 green, 7 teal, 8 sky, 9 blue
const LABEL_COLORS: { [key: number]: string } = {
  1: '#797c86',
  2: '#E65B4C',
  3: '#EF922E',
  4: '#F5CC17',
  5: '#BBD40F',
  6: '#61C951',
  7: '#31C49E',
  8: '#4AB8F4',
  9: '#6193FE',
}

const allTags = [
  { name: 'production', color: 2, created: new Date('2026-01-04') },
  { name: 'staging', color: 4, created: new Date('2026-01-04') },
  { name: 'field-unit', color: 3, created: new Date('2026-02-11') },
  { name: 'us-west', color: 8, created: new Date('2026-02-11') },
  { name: 'eu-central', color: 7, created: new Date('2026-03-02') },
  { name: 'kiosk', color: 6, created: new Date('2026-03-02') },
]

const color = (tag: any) => LABEL_COLORS[tag.color] || LABEL_COLORS[1]

/** The component anchors a Popper on a real DOM node, so the anchor has to be
 *  measured after mount — a callback ref into state forces the second render. */
const Anchor: React.FC<{ caption: string; height?: number; children: (el: Element | null) => React.ReactNode }> = ({
  caption,
  height = 260,
  children,
}) => {
  const [el, setEl] = React.useState<Element | null>(null)
  return (
    <div style={{ width: 300, height }}>
      <div
        ref={setEl as any}
        style={{
          fontSize: 13,
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px dashed rgba(0,0,0,0.18)',
          display: 'inline-block',
          opacity: 0.65,
        }}
      >
        {caption}
      </div>
      {children(el)}
    </div>
  )
}

export const AllTags = () => (
  <Anchor caption="Add tag to raspberrypi-field-01">
    {el => (
      <TagAutocomplete
        open
        targetEl={el}
        items={allTags}
        placeholder="Search tags"
        onItemColor={color}
        onSelect={() => {}}
        onChange={() => {}}
        onClose={() => {}}
      />
    )}
  </Anchor>
)

export const FilteredAndAddable = () => (
  <Anchor caption="Tags already on this device: production, us-west">
    {el => (
      <TagAutocomplete
        open
        allowAdding
        targetEl={el}
        items={allTags}
        filter={[allTags[0], allTags[3]]}
        placeholder="Add or create a tag"
        onItemColor={color}
        onSelect={() => {}}
        onChange={() => {}}
        onClose={() => {}}
      />
    )}
  </Anchor>
)

export const HiddenIcons = () => (
  <Anchor caption="Filter devices by tag" height={240}>
    {el => (
      <TagAutocomplete
        open
        hideIcons
        targetEl={el}
        items={allTags}
        placeholder="Filter by tag"
        onSelect={() => {}}
        onChange={() => {}}
        onClose={() => {}}
      />
    )}
  </Anchor>
)
