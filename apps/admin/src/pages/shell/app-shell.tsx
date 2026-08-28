import {Outlet} from 'react-router'

import {AppNav} from './ui/app-nav'

export function AppShell() {
  return (
    <div>
      <AppNav />
      <Outlet />
    </div>
  )
}
