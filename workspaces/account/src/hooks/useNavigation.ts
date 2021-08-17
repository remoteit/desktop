

interface INavigationHook {
  LeftMenuItems: INavigation[]
  headerMenuItems: IHeaderNavigation[]
}
export function useNavigation(): INavigationHook {

 
  const LeftMenuItems: INavigation[] = [
    
    { path: "/overview",label: 'Overview', icon : 'home'},
    { path: "/profile",label: 'Profile', icon: 'head-side'},
    { path: "/changePassword",label: 'Change Password', icon: 'key'},
    { path: "/plans",label: 'remote.it Plans', icon: 'book'},
    { path: "/otherPlans",label: 'Other Plans', icon: 'th-large'},
    { path: "/notificationSettings",label: 'Notification Setting', icon: 'bell'},
    { path: "/transactions",label: 'Transactions', icon: 'file-alt'},
    { path: "/accessKeys",label: 'Access Keys', icon: 'puzzle-piece'},
    { path: "/remoteWeb",label: 'remote.it for Web', icon: 'browser'},
  ]

  const headerMenuItems: IHeaderNavigation[] = [

    { path: "https://remote.it/solutions/", label: 'Solutions' },
    { path: "https://remote.it/pricing/", label: 'Pricing' },
    { path: "https://remote.it/download/", label: 'Download' },
    { path: "https://remote.it/resources/", label: 'Resource' },
    { path: "https://support.remote.it/hc/en-us", label: 'Support' },
  ]

  return { LeftMenuItems, headerMenuItems }
}
