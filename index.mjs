import { Level } from 'level'

const MAX_ASCII = 128
const VERSION = 1
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

export default class OnOff {
  constructor(
    db = new Level('./db', { valueEncoding: 'json' }),
    options = {}
  ) {
    this.db = db
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

  async recordSignal(currentClones, currentViews, hour, day = this.defaultDay()) {
    this.ensureFiniteInteger(currentClones, 'currentClones')
    this.ensureFiniteInteger(currentViews, 'currentViews')
    this.ensureIntInRange(hour, 'hour', 0, 23)
    this.ensureDayString(day, 'day')

    const cByte = this.mod(currentClones, MAX_ASCII)
    const vByte = this.mod(currentViews, MAX_ASCII)

    const data = {
      v: VERSION,
      ns: this.namespace,
      type: 'ascii',
      cloneChar: String.fromCharCode(cByte),
      viewChar: String.fromCharCode(vByte),
      raw: {
        clones: cByte,
        views: vByte
      },
      checksum: (cByte ^ vByte) & 0x7f,
      timestamp: Date.now(),
      day,
      hour
    }

    await this.db.put(this.key(hour, day), data)
    return data
  }

  async decodeSignal(currentClones, currentViews, hour, day = this.defaultDay()) {
    return this.recordSignal(currentClones, currentViews, hour, day)
  }

  async verify(hour, day = this.defaultDay()) {
    this.ensureIntInRange(hour, 'hour', 0, 23)
    this.ensureDayString(day, 'day')
    const data = await this.db.get(this.key(hour, day))
    const { raw, checksum } = data
    if (!raw) return false
    const cByte = this.mod(raw.clones, MAX_ASCII)
    const vByte = this.mod(raw.views, MAX_ASCII)
    return ((cByte ^ vByte) & 0x7f) === checksum
  }

  async reconstructMessage(startHour = 0, endHour = 23, day = this.defaultDay(), { trim = false } = {}) {
    this.ensureIntInRange(startHour, 'startHour', 0, 23)
    this.ensureIntInRange(endHour, 'endHour', 0, 23)
    if (startHour > endHour) {
      throw new RangeError('startHour must be <= endHour')
    }
    this.ensureDayString(day, 'day')

    const hours = []
    const keys = []
    for (let hour = startHour; hour <= endHour; hour++) {
      hours.push(hour)
      keys.push(this.key(hour, day))
    }

    const results = this.db.getMany
      ? await this.db.getMany(keys).catch(() => [])
      : await Promise.all(keys.map(k => this.db.get(k).catch(() => null)))

    let message = ''
    for (let i = 0; i < results.length; i++) {
      const signal = results[i]
      message += signal ? (signal.cloneChar + signal.viewChar) : '  '
    }
    return trim ? message.trim() : message
  }

  async clear(day = null) {
    let prefix = 'signal:'
    if (day != null) {
      this.ensureDayString(day, 'day')
      prefix = `signal:${day}:${this.namespace}:`
    }

    const gte = prefix
    const lt = prefix + '\xFF'

    const ops = []
    for await (const [key] of this.db.iterator({ gte, lt })) {
      ops.push({ type: 'del', key })
    }
    if (ops.length > 0) {
      await this.db.batch(ops)
    }
  }

  async close() {
    try {
      await this.db?.close()
    } catch { }
  }
}
