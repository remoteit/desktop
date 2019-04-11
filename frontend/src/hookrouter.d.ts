declare module 'hookrouter' {
  interface Route {
    [path: string]: () => React.ReactComponentElement
  }

  declare function useRoutes(route: Route): React.ReactComponentElement
  declare function useTitle(title: string): void
}
