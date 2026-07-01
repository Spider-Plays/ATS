import React from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SidebarBrand } from './layout/SidebarBrand'
import { SidebarNavItem, SidebarSectionLabel } from './layout/SidebarNavItem'
import { SidebarProfileFooter } from './layout/SidebarProfileFooter'
import { api } from '@/services/api'

const VendorSidebar = () => {
  const location = useLocation()
  const path = location.pathname

  const { data: me } = useQuery({
    queryKey: ['vendor-portal-me'],
    queryFn: api.vendorPortal.getMe,
  })

  const submissionCount = me?.stats.totalSubmissions ?? 0

  return (
    <aside className="m3-navigation-drawer flex flex-col fixed left-0 top-0 z-50">
      <SidebarBrand subtitle="Vendor portal" homeTo="/vendor-portal/dashboard" />

      <nav className="sidebar-nav custom-scrollbar">
        <SidebarSectionLabel>Menu</SidebarSectionLabel>
        <SidebarNavItem
          to="/vendor-portal/dashboard"
          icon="dashboard"
          label="Home"
          active={path === '/vendor-portal/dashboard'}
        />
        <SidebarNavItem
          to="/vendor-portal/positions"
          icon="work"
          label="Assigned jobs"
          active={path.startsWith('/vendor-portal/positions')}
        />
        <SidebarNavItem
          to="/vendor-portal/submissions"
          icon="group"
          label="Submitted profiles"
          active={path.startsWith('/vendor-portal/submissions')}
          badge={submissionCount > 0 ? submissionCount : undefined}
        />
        <SidebarNavItem
          to="/vendor-portal/report"
          icon="bar_chart"
          label="Report"
          active={path.startsWith('/vendor-portal/report')}
        />
      </nav>

      <SidebarProfileFooter />
    </aside>
  )
}

export default VendorSidebar
