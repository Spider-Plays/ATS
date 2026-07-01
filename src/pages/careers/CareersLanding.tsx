import React, { useEffect } from 'react'
import { StitchCareersLanding } from './StitchCareersLanding'
import { IgsCareersLanding } from './igs/IgsCareersLanding'
import { useCareersTheme } from './theme/CareersThemeContext'

const CareersLanding = () => {
  const { themeId, theme } = useCareersTheme()

  useEffect(() => {
    document.title = theme.documentTitle
  }, [theme.documentTitle])

  if (themeId === 'igs') return <IgsCareersLanding />
  return <StitchCareersLanding />
}

export default CareersLanding
