import React from 'react'
import { BarChart3 } from 'lucide-react'
import './mis.css'

const MisDashboard = () => {
  return (
    <div className="mis-coming-soon animate-in fade-in duration-500">
      <div className="mis-coming-soon__content">
        <div className="mis-coming-soon__icon-wrap" aria-hidden="true">
          <BarChart3 size={40} className="mis-coming-soon__icon" />
          <span className="mis-coming-soon__ring" />
          <span className="mis-coming-soon__ring mis-coming-soon__ring--delay" />
        </div>

        <p className="mis-coming-soon__status">
          Getting build
          <span className="mis-coming-soon__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </p>

        <p className="mis-coming-soon__title">Coming soon</p>
      </div>
    </div>
  )
}

export default MisDashboard
