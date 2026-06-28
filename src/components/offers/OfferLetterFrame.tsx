import React, { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'

type OfferLetterFrameProps = {
  html: string
  title?: string
  className?: string
}

export function OfferLetterFrame({
  html,
  title = 'Offer letter',
  className,
}: OfferLetterFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(960)

  const src = useMemo(() => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    return URL.createObjectURL(blob)
  }, [html])

  useEffect(() => () => URL.revokeObjectURL(src), [src])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const resize = () => {
      try {
        const doc = iframe.contentDocument
        const body = doc?.body
        const htmlEl = doc?.documentElement
        if (!body) return
        const contentHeight = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          htmlEl?.scrollHeight ?? 0,
          htmlEl?.offsetHeight ?? 0
        )
        setHeight(Math.max(640, contentHeight + 24))
      } catch {
        setHeight(2400)
      }
    }

    iframe.addEventListener('load', resize)
    const timer = window.setTimeout(resize, 150)
    return () => {
      iframe.removeEventListener('load', resize)
      window.clearTimeout(timer)
    }
  }, [src])

  return (
    <iframe
      ref={iframeRef}
      title={title}
      src={src}
      className={clsx('w-full border rounded-xl bg-slate-100', className)}
      style={{ height: `${height}px` }}
      sandbox="allow-same-origin"
    />
  )
}
