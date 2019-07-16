import axios from 'axios'
import setup from 'remote.it'
import { API_URL, DEVELOPER_KEY } from '../constants'

export const r3 = setup({ apiURL: API_URL, developerKey: DEVELOPER_KEY })
