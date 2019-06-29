import ConnectionPool from './ConnectionPool'
import * as PeerConnection from './connection'
import UserCredentialsFile from './UserCredentialsFile'
import SavedConnectionsFile from './SavedConnectionsFile'

jest.mock('./UserCredentialsFile')
jest.mock('./connection')

describe('Pool', () => {
  describe('.register', () => {
    const connection = {
      deviceID: 'some-deviceID',
      serviceID: 'some-serviceID',
      serviceName: 'some-serviceName',
      type: 'SSH',
      port: 35000,
    }
    const user = {
      authHash: 'some-authhash',
      username: 'some-username',
      language: 'some-language',
    }

    beforeEach(() => {
      jest.spyOn(UserCredentialsFile, 'write')
    })

    test('starts a new connection if valid', async () => {
      const process = { info: connection } as ConnectdProcess
      jest.spyOn(PeerConnection, 'connect').mockResolvedValue(process)
      jest.spyOn(UserCredentialsFile, 'read').mockReturnValueOnce(user)

      const proc = await ConnectionPool.register({
        connection,
        user,
      })

      expect(ConnectionPool.pool).toHaveLength(1)
      expect(ConnectionPool.pool[0]).toEqual(connection)
      expect(proc).toEqual({ info: connection })
    })

    test('returns a duplicate connection instead of creating a new one', async () => {
      const process = { info: connection } as ConnectdProcess
      jest
        .spyOn(ConnectionPool, 'findDuplicateConnection')
        .mockReturnValue(process)
      const proc = await ConnectionPool.register({ connection, user })
      expect(proc).toEqual(ConnectionPool.processes[0])
      expect(ConnectionPool.pool).toHaveLength(1)
    })
  })

  describe('.loadFromSavedConnectionsFile', () => {
    test('should do nothing if no saved connections file', async () => {
      jest.spyOn(SavedConnectionsFile, 'read').mockReturnValue(undefined)
      const connections = await ConnectionPool.loadFromSavedConnectionsFile()
      expect(connections).toBeUndefined()
    })

    test('should add a connection for each saved connection', async () => {
      const user = {
        authHash: 'some-authhash',
        username: 'some-username',
        language: 'some-language',
      }
      const savedConnections = [
        {
          deviceID: 'some-deviceID',
          serviceID: 'some-serviceID',
          serviceName: 'some-serviceName',
          type: 'SSH',
          port: 35000,
        },
      ]
      // const process = { info: connection } as ConnectdProcess
      jest
        .spyOn(PeerConnection, 'connect')
        .mockResolvedValueOnce({ info: savedConnections[0] } as ConnectdProcess)
      jest.spyOn(UserCredentialsFile, 'read').mockReturnValueOnce(user)
      jest
        .spyOn(SavedConnectionsFile, 'read')
        .mockReturnValueOnce(savedConnections)
      const connections = await ConnectionPool.loadFromSavedConnectionsFile()
      expect(connections).toHaveLength(1)
      if (!connections) throw new Error('no connections')
      expect(savedConnections[0]).toEqual(connections[0].info)
    })
  })
})
