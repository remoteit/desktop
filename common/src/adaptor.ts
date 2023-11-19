export let adaptor: CommonAdaptorInterface | undefined

export function initialize(sharedAdaptor: CommonAdaptorInterface) {
  adaptor = sharedAdaptor
}
