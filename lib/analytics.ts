type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>
  gtag?: (command: string, eventName: string, payload?: AnalyticsPayload) => void
  va?: { track?: (eventName: string, payload?: AnalyticsPayload) => void }
  plausible?: (eventName: string, options?: { props?: AnalyticsPayload }) => void
}

export function trackMarketingEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") {
    return
  }

  const analyticsWindow = window as AnalyticsWindow

  if (analyticsWindow.dataLayer) {
    analyticsWindow.dataLayer.push({
      event: eventName,
      ...payload,
    })
  }

  analyticsWindow.gtag?.("event", eventName, payload)
  analyticsWindow.va?.track?.(eventName, payload)
  analyticsWindow.plausible?.(eventName, { props: payload })
}
