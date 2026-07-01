import React from 'react'
import { Outlet } from 'react-router-dom'
import { ReportsSubNav } from './ReportsSubNav'

const ReportsLayout = () => {
  return (
    <div className="flex flex-col min-h-0">
      <ReportsSubNav />
      <div className="flex-1 px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </div>
  )
}

export default ReportsLayout
