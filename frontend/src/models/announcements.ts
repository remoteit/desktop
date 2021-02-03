import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { graphQLReadNotice } from '../services/graphQLMutation'
import { AxiosResponse } from 'axios'
import { RootModel } from './rootModel'

type IAnnouncementsState = ILookup<IAnnouncement[]> & {
  all: IAnnouncement[]
}

const announcementState: IAnnouncementsState = {
  all: [],
}

export default createModel<RootModel>()({
  state: announcementState,
  effects: dispatch => ({
    async fetch() {
      try {
        const result = await graphQLRequest(
          ` {
            notices {
              id
              title
              body
              image
              link
              type
              modified
              read
            }
          }`
        )
        const all = await dispatch.announcements.parse(result)
        dispatch.announcements.set({ all })
        graphQLGetErrors(result)
      } catch (error) {
        await graphQLCatchError(error)
      }
    },
    async parse(result: AxiosResponse<any> | undefined): Promise<IAnnouncement[]> {
      const all = result?.data?.data?.notices
      // const all = TEST_DATA
      console.log('ANNOUNCEMENTS', all)
      return all.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        image: n.image,
        link: n.link,
        type: n.type,
        modified: new Date(n.modified),
        read: n.read ? new Date(n.read) : undefined,
      }))
    },
    async read(id: string, state) {
      console.log('ANNOUNCEMENT READ', id)
      await graphQLReadNotice(id)
      dispatch.announcements.setRead(id)
    },
  }),
  reducers: {
    setRead(state, id: string) {
      state.all.find((a, i) => {
        if (a.id === id) state.all[i].read = new Date()
      })
      return state
    },
    set(state, params: ILookup<IAnnouncement[]>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

export function selectAnnouncements(state: ApplicationState, unread?: boolean) {
  return state.announcements.all.filter(a => !unread || !a.read)
}

const TEST_DATA: any = [
  {
    body:
      '<div>You can now use remote.it to easily connect to your AWS resources. Securely access your AWS VPCs without IP whitelists or open ports.</div><ul>  <li>Eliminate cumbersome IP Whitelists</li>  <li>Close vulnerable open ports</li>  <li>No more full VPC access: isolate resource access</li>  <li>Harden existing security measures or use as a standalone solution</li>                                                </ul>',
    id: 'ac6da898-64e2-11eb-8cce-02fe4f7c5a93',
    image: 'https://downloads.remote.it/images/aws-marketplace-photo.png',
    link: 'https://remote.it/aws/',
    modified: '2021-02-01T23:57:23.920Z',
    read: null,
    title: 'remote.it for AWS Released',
    type: 'COMMUNICATION',
  },
  {
    body:
      'With Device List Sharing, you can quickly share your device list to other remote.it users. This would provide them with shared access to all the devices you own and allow them to connect to the services.',
    id: 'ac6dabe0-64e2-11eb-8cce-02fe4f7c5a93',
    image: null,
    link: 'https://support.remote.it/hc/en-us/articles/360053354671-Device-Service-Sharing',
    modified: '2021-02-01T23:57:07.420Z',
    read: null,
    title: 'Device List Sharing',
    type: 'RELEASE',
  },
]
