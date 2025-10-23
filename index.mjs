const BASE3_CHARS = '012'
const BASE36_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const BASE = 3
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

export default class OnOff {
  constructor(options = {}) {
    this.db = {}
    this.namespace = options.namespace || 'default'
  }

  defaultDay(date = new Date()) {
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(date.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  ensureIntInRange(n, name, min, max) {
    if (!Number.isInteger(n)) {
      throw new TypeError(`${name} must be an integer`)
    }
    if (n < min || n > max) {
      throw new RangeError(`${name} must be in [${min}, ${max}]`)
    }
  }

  ensureFiniteInteger(n, name) {
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      throw new TypeError(`${name} must be a finite integer`)
    }
  }

  ensureDayString(day, name = 'day') {
    if (typeof day !== 'string' || !DAY_RE.test(day)) {
      throw new TypeError(`${name} must be a UTC day string in YYYY-MM-DD format`)
    }
    const [y, m, d] = day.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    const normalized = this.defaultDay(dt)
    if (normalized !== day) {
      throw new RangeError(`${name} is not a valid UTC calendar day: ${day}`)
    }
  }

  mod(n, m) {
    return ((n % m) + m) % m
  }

  key(hour, day) {
    if (day == null) {
      throw new Error('UTC day is required for keying (YYYY-MM-DD)')
    }
    this.ensureIntInRange(hour, 'hour', 0, 23)
    this.ensureDayString(day, 'day')
    const hh = hour.toString().padStart(2, '0')
    return `signal:${day}:${this.namespace}:${hh}`
  }

  async recordSignal(views, hour, day = this.defaultDay()) {
    this.ensureFiniteInteger(views, 'views')
    this.ensureIntInRange(hour, 'hour', 0, 23)
    this.ensureDayString(day, 'day')

    let char
    let charIndex = 0
    
    if (views === 0) {
      char = ' '
    } else {
      charIndex = this.mod(views - 1, BASE)
      char = BASE3_CHARS[charIndex]
    }

    const data = {
      ns: this.namespace,
      type: 'base3',
      char: char,
      raw: {
        views: views,
        charIndex: charIndex
      },
      timestamp: Date.now(),
      day,
      hour
    }

    const key = this.key(hour, day)
    this.db[key] = data
    return data
  }

  async decodeSignal(views, hour, day = this.defaultDay()) {
    return this.recordSignal(views, hour, day)
  }

  base3ToBase36(base3String) {
    let decimal = 0
    for (let i = 0; i < base3String.length; i++) {
      const digit = parseInt(base3String[i], 3)
      decimal = decimal * 3 + digit
    }

    if (decimal < BASE36_CHARS.length) {
      return BASE36_CHARS[decimal]
    }
    return ' '
  }

  async reconstructMessage(startHour = 0, endHour = 23, day = this.defaultDay(), { trim = false } = {}) {
    this.ensureIntInRange(startHour, 'startHour', 0, 23)
    this.ensureIntInRange(endHour, 'endHour', 0, 23)
    if (startHour > endHour) {
      throw new RangeError('startHour must be <= endHour')
    }
    this.ensureDayString(day, 'day')

    let base3Message = ''
    for (let hour = startHour; hour <= endHour; hour++) {
      const key = this.key(hour, day)
      const signal = this.db[key]
      base3Message += signal ? signal.char : ' '
    }

    let alphanumericMessage = ''
    for (let i = 0; i < base3Message.length; i += 4) {
      const base3Chunk = base3Message.slice(i, i + 4)

      if (base3Chunk.includes(' ')) {
        alphanumericMessage += ' '
      } else {
        const paddedChunk = base3Chunk.padEnd(4, '0')
        const base36Char = this.base3ToBase36(paddedChunk)
        alphanumericMessage += base36Char
      }
    }

    return trim ? alphanumericMessage.trim() : alphanumericMessage
  }

  async clear(day = null) {
    if (day != null) {
      this.ensureDayString(day, 'day')
      const prefix = `signal:${day}:${this.namespace}:`
      Object.keys(this.db).forEach(key => {
        if (key.startsWith(prefix)) {
          delete this.db[key]
        }
      })
    } else {
      Object.keys(this.db).forEach(key => {
        if (key.startsWith('signal:')) {
          delete this.db[key]
        }
      })
    }
  }
}