import React from 'react'
import clsx from 'clsx'

type DocumentPreviewFrameProps = {
  blobUrl: string
  title: string
  mimeType?: string | null
  fileName?: string
  className?: string
}

function isPdfDocument(mimeType?: string | null, fileName?: string): boolean {
  return (
    mimeType === 'application/pdf' ||
    Boolean(fileName?.toLowerCase().endsWith('.pdf'))
  )
}

/** View-only embedded document preview (PDF toolbar hidden where supported). */
export function DocumentPreviewFrame({
  blobUrl,
  title,
  mimeType,
  fileName,
  className,
}: DocumentPreviewFrameProps) {
  if (!isPdfDocument(mimeType, fileName)) {
    return (
      <p className="text-sm text-slate-500 text-center py-12">
        In-browser preview is available for PDF resumes only.
      </p>
    )
  }

  const src = `${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`

  return (
    <iframe
      src={src}
      title={title}
      className={clsx('w-full border-0 rounded-xl bg-white', className)}
      style={{ height: 'min(72vh, 640px)', minHeight: 480 }}
    />
  )
}
