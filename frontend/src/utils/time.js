// Pakistan Standard Time helpers.
// The backend stores timestamps as naive UTC datetimes. Pydantic serializes
// them without a "Z" suffix, so `new Date(value)` would otherwise interpret
// them as the browser's local time. We force UTC interpretation here and then
// render in Asia/Karachi (UTC+5, no DST).

const PKT_TIMEZONE = 'Asia/Karachi'

function parseAsUTC(value) {
  if (value instanceof Date) return value
  if (typeof value !== 'string') return new Date(value)

  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(value)
  return new Date(hasTimezone ? value : `${value}Z`)
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: PKT_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

const timeOnlyFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: PKT_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

const dateOnlyFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: PKT_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatPKT(value) {
  const date = parseAsUTC(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${dateTimeFormatter.format(date)} PKT`
}

export function formatPKTTime(value) {
  const date = parseAsUTC(value)
  if (Number.isNaN(date.getTime())) return ''
  return timeOnlyFormatter.format(date)
}

export function formatPKTDate(value) {
  const date = parseAsUTC(value)
  if (Number.isNaN(date.getTime())) return ''
  return dateOnlyFormatter.format(date)
}
