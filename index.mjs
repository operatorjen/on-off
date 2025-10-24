const DIGITS = '0123456789'
const BASE_CHARS = `${DIGITS}ABCDEFGHIJKLMNOPQRSTUVWXYZ`
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const HOURS = 23

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
    this.ensureIntInRange(hour, 'hour', 0, HOURS)
    this.ensureDayString(day, 'day')
    const hh = hour.toString().padStart(2, '0')
    return `signal:${day}:${this.namespace}:${hh}`
  }

  async reconstructMessage(base = 3, startHour = 0, endHour = 23, day = this.defaultDay(), { trim = false } = {}) {
    this.ensureIntInRange(startHour, 'startHour', 0, HOURS)
    this.ensureIntInRange(endHour, 'endHour', 0, HOURS)
    if (startHour > endHour) {
      throw new RangeError('startHour must be <= endHour')
    }
    this.ensureDayString(day, 'day')

    let baseMessage = ''
    for (let hour = startHour; hour <= endHour; hour++) {
      const key = this.key(hour, day)
      const signal = this.db[key]
      baseMessage += signal ? signal.char : ' '
    }

    let alphanumericMessage = ''
    const chunkSize = this.getChunkSize(base)

    for (let i = 0; i < baseMessage.length; i += chunkSize) {
      const baseChunk = baseMessage.slice(i, i + chunkSize)
      if (baseChunk.includes(' ')) {
        alphanumericMessage += ' '
      } else {
        const paddedChunk = baseChunk.padEnd(chunkSize, '0')
        const base36Char = this.baseXToBase36(base, paddedChunk)
        alphanumericMessage += base36Char
      }
    }

    return trim ? alphanumericMessage.trim() : alphanumericMessage
  }

  async decodeSignal(base = 3, views, hour, day = this.defaultDay()) {
    return this.recordSignal(base, views, hour, day)
  }

  async recordSignal(base = 3, views, hour, day = this.defaultDay()) {
    this.ensureFiniteInteger(views, 'views')
    this.ensureIntInRange(hour, 'hour', 0, HOURS)
    this.ensureDayString(day, 'day')

    let char
    let charIndex = 0
    
    if (views === 0) {
      char = ' '
    } else {
      charIndex = this.mod(views - 1, base)
      const baseDigits = this.getBaseDigits(base)
      char = baseDigits[charIndex]
    }
    
    const data = {
      ns: this.namespace,
      type: `base${base}`,
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

  getBaseDigits(base = 3) {
    if (base <= 10) return DIGITS.slice(0, base)
    return BASE_CHARS.slice(0, base)
  }

  getChunkSize(base = 3) {
    return Math.ceil(Math.log(36) / Math.log(base))
  }

  baseXToBase36(base = 3, baseString) {
    let decimal = 0
    const baseDigits = this.getBaseDigits(base)
    
    for (let i = 0; i < baseString.length; i++) {
      const char = baseString[i]
      const digitValue = baseDigits.indexOf(char)
      decimal = decimal * base + digitValue
    }
    
    return decimal < BASE_CHARS.length ? BASE_CHARS[decimal] : ' '
  }

  base36ToBaseX(base = 3, base36Char) {
    if (base36Char === ' ') {
      const chunkSize = this.getChunkSize(base)
      return '0'.repeat(chunkSize)
    }

    const decimal = BASE_CHARS.indexOf(base36Char)

    if (decimal === -1) {
      const chunkSize = this.getChunkSize(base)
      return '0'.repeat(chunkSize)
    }

    const baseDigits = this.getBaseDigits(base)
    const chunkSize = this.getChunkSize(base)
    let result = ''
    let n = decimal

    for (let i = 0; i < chunkSize; i++) {
      if (n === 0 && i > 0) {
        result = baseDigits[0] + result
      } else {
        const remainder = n % base
        result = baseDigits[remainder] + result
        n = Math.floor(n / base)
      }
    }

    return result
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