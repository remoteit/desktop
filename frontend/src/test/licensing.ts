export const testData: {
  license: boolean
  limit: boolean
  unlicensed: boolean
  licenses: ILicense[]
  limits: ILimit[]
} = {
  license: false,
  limit: false,
  unlicensed: false,
  licenses: [
    {
      id: 'e46e5c55-7d12-46c5-aee3-493e29e604db',
      created: new Date('2020-10-17T01:03:47.976Z'),
      updated: new Date('2020-10-17T01:03:47.976Z'),
      expiration: new Date('2020-11-05T01:03:48.000Z'),
      valid: true,
      quantity: null,
      custom: false,
      subscription: {
        total: 1,
        status: 'ACTIVE',
        price: null,
        card: null,
      },
      plan: {
        id: '649b2e68-05fd-11eb-bda8-021f403e8c27',
        name: 'TRIAL',
        description: 'trial',
        product: {
          id: '55d9e884-05fd-11eb-bda8-021f403e8c27',
          name: 'AWS',
          description: 'AWS',
        },
      },
    },
    {
      id: '4a5ed500-ef07-4a98-be11-PERSONAL',
      created: new Date('2021-03-12T05:44:32.421Z'),
      updated: new Date('2021-03-12T05:44:32.421Z'),
      expiration: new Date('2021-02-12T05:44:32.421Z'),
      valid: false,
      quantity: null,
      custom: false,
      subscription: {
        total: 1,
        status: 'CANCELED',
        price: null,
        card: null,
      },
      plan: {
        id: 'e147a026-81d7-11eb-afc8-02f048730623',
        name: 'PERSONAL',
        description: 'personal',
        product: {
          id: 'b999e047-5532-11eb-8872-063ce187bcd7',
          name: 'remote.it',
          description: 'remote.it',
        },
      },
    },
    {
      id: '4a5ed500-ef07-4a98-be11-PROFESSIONAL',
      created: new Date('2021-03-12T05:44:32.421Z'),
      updated: new Date('2021-03-12T05:44:32.421Z'),
      expiration: new Date('2021-02-12T05:44:32.421Z'),
      valid: false,
      quantity: null,
      custom: true,
      subscription: {
        total: 1,
        status: 'INCOMPLETE',
        price: null,
        card: null,
      },
      plan: {
        id: 'e147a026-81d7-11eb-afc8-02f048730623',
        name: 'PROFESSIONAL',
        description: 'professional',
        product: {
          id: 'b999e047-5532-11eb-8872-063ce187bcd7',
          name: 'remote.it',
          description: 'remote.it',
        },
      },
    },
    {
      id: '4a5ed500-ef07-4a98-be11-BUSINESS',
      created: new Date('2021-03-12T05:44:32.421Z'),
      updated: new Date('2021-03-12T05:44:32.421Z'),
      expiration: null,
      valid: true,
      quantity: null,
      custom: false,
      subscription: {
        total: 1,
        status: 'INCOMPLETE_EXPIRED',
        price: null,
        card: null,
      },
      plan: {
        id: 'e147a026-81d7-11eb-afc8-02f048730623',
        name: 'BUSINESS',
        description: 'business',
        product: {
          id: 'b999e047-5532-11eb-8872-063ce187bcd7',
          name: 'remote.it',
          description: 'remote.it',
        },
      },
    },
    {
      id: '4a5ed500-ef07-4a98-be11-BUSINESS',
      created: new Date('2021-03-12T05:44:32.421Z'),
      updated: new Date('2021-03-12T05:44:32.421Z'),
      expiration: null,
      valid: true,
      quantity: null,
      custom: false,
      subscription: {
        total: 1,
        status: 'PAST_DUE',
        price: null,
        card: null,
      },
      plan: {
        id: 'e147a026-81d7-11eb-afc8-02f048730623',
        name: 'BUSINESS',
        description: 'business',
        product: {
          id: 'b999e047-5532-11eb-8872-063ce187bcd7',
          name: 'remote.it',
          description: 'remote.it',
        },
      },
    },
    {
      id: '4a5ed500-ef07-4a98-be11-35ab8fa69a5f',
      created: new Date('2021-03-12T05:44:32.421Z'),
      updated: new Date('2021-04-28T17:08:25.000Z'),
      expiration: null,
      valid: true,
      quantity: null,
      custom: false,
      subscription: {
        total: 1,
        status: 'PAST_DUE',
        price: null,
        card: null,
      },
      plan: {
        id: 'b44f92a6-a7b9-11eb-b094-02a962787033',
        name: 'ENTERPRISE',
        description: 'enterprise',
        product: {
          id: 'b999e047-5532-11eb-8872-063ce187bcd7',
          name: 'remote.it',
          description: 'remote.it',
        },
      },
    },
  ],
  limits: [],
}
