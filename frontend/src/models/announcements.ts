import { createModel } from '@rematch/core'
import { State } from '../store'
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
          ` query Announcements {
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

const TEST_DATA: any = [
  {
    body: `<p>
    We&rsquor;re excited to announce an enhanced security feature for our <b>Persistant Public URLs:</b>
    Web Application Firewall (WAF) integration!
  </p>
  <p>
    <b>What does this mean for you?</b>
  </p>
  <ul>
    <li>
      <b>Enhanced Security:</b> The WAF acts as a protective shield for your web
      endpoint, blocking malicious requests and known vulnerabilities.
    </li>
    <li>
      <b>Peace of Mind:</b>With this added layer, you can be more confident that
      your endpoint and our infrastructure are better protected from attacks.
    </li>
    <li>
      <b> Automated Protection:</b> No need for manual configuration; the WAF
      automatically blocks threats before they reach your service.
    </li>
  </ul>
  <p>
    <b>How Does It Work?</b>
  </p>
  <p>
    The WAF examines incoming traffic to your web endpoint, identifying and
    blocking any suspicious activity or known exploits. This all happens before
    the requests even get to your service, making your interaction with Remote.It
    more secure than ever.
  </p>
  <p>
    We&rsquor;re committed to providing a safe and secure experience for all our
    users, and this is just another step in that direction.
  </p>`,
    id: 'ac6dabe0-64e2-11eb-8cce-02fe4f7c5xxx',
    image: '/large-screen.jpg',
    link: '',
    modified: '2021-02-01T23:57:07.420Z',
    read: null,
    title: 'Public URL Firewall Protection',
    type: 'COMMUNICATION',
  },
  {
    body: `<p>With its responsive design and resizable panels, Remote.It now allows you to customize the layout and information displayed on your screen.</p>
      <p>This update includes:</p>
      <ul>
        <li>New full-screen design and layout for ease of use</li>
        <li>Responsive layout with resizable panels that adapt to different screen sizes</li>
        <li>Enhanced connection search across multiple device lists</li>
        <li>Connect on-demand for greater convenience when launching your connections</li>
        <li>New Account Management menu</li>
      </ul>
      `,
    id: 'ac6dabe0-64e2-11eb-8cce-02fe4f7c5xxx',
    image: '/large-screen.jpg',
    link: '',
    modified: '2021-02-01T23:57:07.420Z',
    read: null,
    title: 'Full-screen layout',
    type: 'RELEASE',
  },
  {
    body: 'You can now connect on-demand to keep your connections idle, but always ready to use. Just save the connection settings in your client applications and Remote.It will only connect when needed.',
    id: 'ac6dabe0-64e2-11eb-8cce-02fe4f7c5xxx',
    image: null,
    link: '',
    modified: '2021-02-01T23:57:07.420Z',
    read: null,
    title: 'Connect on demand',
    type: 'RELEASE',
  },
  {
    body: '<div>You can now use Remote.It to easily connect to your AWS resources. Securely access your AWS VPCs without IP whitelists or open ports.</div><ul>  <li>Eliminate cumbersome IP Whitelists</li>  <li>Close vulnerable open ports</li>  <li>No more full VPC access: isolate resource access</li>  <li>Harden existing security measures or use as a standalone solution</li>                                                </ul>',
    id: 'ac6da898-64e2-11eb-8cce-02fe4f7c5a93',
    image: 'https://downloads.remote.it/images/aws-marketplace-photo.png',
    link: 'https://remote.it/aws/',
    modified: '2021-02-01T23:57:23.920Z',
    read: null,
    title: 'Remote.It for AWS Released',
    type: 'COMMUNICATION',
  },
]
