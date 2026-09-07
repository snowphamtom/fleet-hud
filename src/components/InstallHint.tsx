import { useEffect, useState } from 'react'
import { SectionLabel } from './SectionLabel'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallHint() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [standalone, setStandalone] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    const iosStandalone =
      'standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    setStandalone(mq.matches || iosStandalone)

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  if (standalone) {
    return (
      <article className="panel install-hint">
        <SectionLabel title="PWA" value="installed" />
        <p className="stub-body">Running as installed app — good.</p>
      </article>
    )
  }

  return (
    <article className="panel install-hint">
      <SectionLabel title="ADD TO HOME SCREEN" />
      <ol className="install-steps">
        <li>
          <b>iOS Safari:</b> Share → Add to Home Screen
        </li>
        <li>
          <b>Android Chrome:</b> Menu → Install app / Add to Home screen
        </li>
        <li>
          <b>Desktop Chrome:</b> install icon in address bar when available
        </li>
      </ol>
      {deferred && (
        <button
          type="button"
          className="btn primary"
          onClick={async () => {
            await deferred.prompt()
            setDeferred(null)
          }}
        >
          Install Fleet HUD
        </button>
      )}
    </article>
  )
}
