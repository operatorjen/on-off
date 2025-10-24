# On / Off

Dynamic Base Signaling Protocol

A flexible encoding system that can use any base from 2 to 36 to encode 0-9A-Z characters into daily configurations.

## Encoding Rules:

- **0 views** → empty/space (no signal)  
- **1+ views** → BaseX digit: `(views - 1) % base` where X is between 2-36
- Hourly signals over 24-hour UTC cycles

*Note: a view represents any countable metric - e.g. web traffic, sensor readings, observation events, etc.*

## Structure for Base3 and Base36:

    Hours 00-03: 4 Base3 digits → char1
    Hours 04-07: 4 Base3 digits → char2
    ...
    Hours 20-23: 4 Base3 digits → char6

    ////////////////////////////////////

    Hours 00: 1 Base36 digits → char1
    Hours 01: 1 Base36 digits → char2
    ...
    Hours 23-23: 1 Base36 digits → char36

## Usage:

    ```javascript
    const protocol = new OnOff()
    const base = 16

    await protocol.decodeSignal(base, 2, 0)
    await protocol.decodeSignal(base, 2, 1)
    await protocol.decodeSignal(base, 2, 2)
    await protocol.decodeSignal(base, 3, 3)

    const message = await protocol.reconstructMessage(3, 0, 23)
    // message = "HI"
    ```

## Technical Notes:

- UTC day boundaries only
- Views-only encoding (clones ignored)
