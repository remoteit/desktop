import { createModel } from '@rematch/core'
import { graphQLBasicRequest } from '../services/graphQL'
import { AxiosResponse } from 'axios'
import { RootModel } from './rootModel'

type IAnnouncementsState = ILookup<IAnnouncement[]> & {
  all: IAnnouncement[]
}

type INoticeType = 'GENERIC' | 'SYSTEM' | 'RELEASE' | 'COMMUNICATION'

const noticesState: IAnnouncementsState = {
  all: [],
}

export default createModel<RootModel>()({
  state: noticesState,
  effects: dispatch => ({
    async fetch() {
      const result = await graphQLBasicRequest(
        ` {
            notices {
              id
              type
              stage
              title
              preview
              body
              image
              modified
              enabled
              read
              from
              until
            }
          }`
      )

      const all = await dispatch.announcements.parse(result)
      dispatch.announcements.set({ all })
    },
    async parse(result: AxiosResponse<any> | undefined, state): Promise<IAnnouncement[]> {
      const all: any = [
        {
          title: 'remote.it for AWS',
          image: 'https://remote.it/wp-content/uploads/2020/09/servers_header_aws.png',
          preview: `
            <div>Secure Remote Access to Your AWS VPCs Without IP Whitelists or Open Ports</div>
            <ul>
              <li>Eliminate cumbersome IP Whitelists</li>
              <li>Close vulnerable open ports</li>
              <li>No more full VPC access: isolate resource access</li>
              <li>Harden existing security measures or use as a standalone solution</li>                                                
            </ul>
          `,
          body: `
          <div>Secure Remote Access to Your AWS VPCs Without IP Whitelists or Open Ports</div>
          <ul>
            <li>Eliminate cumbersome IP Whitelists</li>
            <li>Close vulnerable open ports</li>
            <li>No more full VPC access: isolate resource access</li>
            <li>Harden existing security measures or use as a standalone solution</li>                                                
          </ul>
          <a href="https://aws.amazon.com/marketplace/pp/B08KCF8BY5" target="_blank">Free Trial</a>
          `,
          enabled: true,
          from: null,
          id: 'c21a9fc6-5c70-11eb-8872-063ce187bcd8',
          modified: '2021-01-22T05:25:06.845Z',
          read: null,
          stage: 'beta',
          type: 'COMMUNICATION',
          until: null,
        },
        {
          body: 'This is the <b>body<b>',
          enabled: true,
          from: null,
          image: '',
          id: 'c21a9fc6-5c70-11eb-8872-063ce187bcd7',
          modified: '2021-01-22T05:25:06.845Z',
          preview: 'This is a <b>preview<b>',
          read: null,
          stage: 'beta',
          title: 'This is the title',
          type: 'GENERIC',
          until: null,
        },
      ]
      // const all = result?.data?.data?.notices as INotice[]
      console.log('NOTICES', all)
      return all.map(n => ({
        id: n.id,
        enabled: n.enabled,
        title: n.title,
        body: n.body,
        image: n.image,
        preview: n.preview,
        type: n.type,
        stage: n.stage,
        modified: new Date(n.modified),
        from: n.from ? new Date(n.from) : undefined,
        read: n.read ? new Date(n.read) : undefined, // if null never read it
        until: n.until ? new Date(n.until) : undefined,
      }))
    },
    async read(id: string) {
      //
    },
  }),
  reducers: {
    set(state: IAnnouncementsState, params: ILookup<IAnnouncement[]>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
