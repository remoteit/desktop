import * as Pool from './Pool'

describe('Pool', () => {
  describe('.register', () => {
    xtest('foo', async () => {
      const proc = await Pool.register({
        connection: {
          deviceID: 'some-deviceID',
          serviceID: 'some-serviceID',
          serviceName: 'some-serviceName',
          type: 'SSH',
          port: 35000,
          pid: 12345,
        },
        user: {
          authHash: 'some-authhash',
          username: 'some-username',
          language: 'some-language',
        },
      })
      console.log(proc)
      expect(false).toBe(true)
    })
  })
})
