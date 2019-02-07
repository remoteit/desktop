interface Options {
  id: string
}

export default class Service {
  public id: string

  constructor(opts: Options) {
    this.id = opts.id
  }
}
