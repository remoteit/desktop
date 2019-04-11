declare module 'hookrouter' {
  interface Route {
    [path: string]: () => React.ReactComponentElement
  }

  declare function useRoutes(route: Route): React.ReactComponentElement
  declare function useTitle(title: string): void
  declare function navigate(
    path: string,
    erase?: boolean,
    query?: { [key: string]: string }
  ): void
}
