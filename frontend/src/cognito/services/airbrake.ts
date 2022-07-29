import AirbrakeClient from 'airbrake-js'

const client = new AirbrakeClient({
  environment: process.env.NODE_ENV,
  projectId: 205415,
  projectKey: '7cf55f197f817ce19e65d67d1c4d197f',
})

client.addFilter((notice: any | null) => {
  if (process.env.NODE_ENV === 'test') return null
  return notice
})

export default client
