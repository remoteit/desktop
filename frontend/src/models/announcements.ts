import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLRequest, graphQLGetErrors, apiError } from '../services/graphQL'
import { graphQLReadNotice } from '../services/graphQLMutation'
import { AxiosResponse } from 'axios'
import { RootModel } from '.'

type IAnnouncementsState = ILookup<IAnnouncement[]> & {
  all: IAnnouncement[]
}

const defaultState: IAnnouncementsState = {
  all: [],
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async fetch() {
      try {
        const response = await graphQLRequest(
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
        graphQLGetErrors(response)
        const all = await dispatch.announcements.parse(response)
        dispatch.announcements.set({ all })
      } catch (error) {
        await apiError(error)
      }
    },
    async parse(response: AxiosResponse<any> | void, globalState): Promise<IAnnouncement[]> {
      if (!response) return []
      const all = response?.data?.data?.notices
      // const all = TEST_DATA
      if (!all) return []
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
    reset(state: IAnnouncementsState) {
      state = { ...defaultState }
      return state
    },
    setRead(state, id: string) {
      state.all.find((a, i) => {
        if (a.id === id) {
          state.all[i].read = new Date()
          return true
        }
        return false
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

// const TEST_DATA: any = [
//   {
//     body: `<p>With its responsive design and resizable panels, remote.it now allows you to customize the layout and information displayed on your screen.</p>
//       <p>This update includes:</p>
//       <ul>
//         <li>New full-screen design and layout for ease of use</li>
//         <li>Responsive layout with resizable panels that adapt to different screen sizes</li>
//         <li>Enhanced connection search across multiple device lists</li>
//         <li>Connect on-demand for greater convenience when launching your connections</li>
//         <li>New Account Management menu</li>
//       </ul>
//       `,
//     id: 'ac6dabe0-64e2-11eb-8cce-02fe4f7c5xxx',
//     image: '/large-screen.jpg',
//     link: '',
//     modified: '2021-02-01T23:57:07.420Z',
//     read: null,
//     title: 'Full-screen layout',
//     type: 'RELEASE',
//   },
//   {
//     body: 'You can now connect on-demand to keep your connections idle, but always ready to use. Just save the connection settings in your client applications and remote.it will only connect when needed.',
//     id: 'ac6dabe0-64e2-11eb-8cce-02fe4f7c5xxx',
//     image: null,
//     link: '',
//     modified: '2021-02-01T23:57:07.420Z',
//     read: null,
//     title: 'Connect on demand',
//     type: 'RELEASE',
//   },
//   {
//     body: '<div>You can now use remote.it to easily connect to your AWS resources. Securely access your AWS VPCs without IP whitelists or open ports.</div><ul>  <li>Eliminate cumbersome IP Whitelists</li>  <li>Close vulnerable open ports</li>  <li>No more full VPC access: isolate resource access</li>  <li>Harden existing security measures or use as a standalone solution</li>                                                </ul>',
//     id: 'ac6da898-64e2-11eb-8cce-02fe4f7c5a93',
//     image: 'https://downloads.remote.it/images/aws-marketplace-photo.png',
//     link: 'https://remote.it/aws/',
//     modified: '2021-02-01T23:57:23.920Z',
//     read: null,
//     title: 'remote.it for AWS Released',
//     type: 'COMMUNICATION',
//   },
// ]
