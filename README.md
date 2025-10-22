# On / Off

Signaling protocol :::::::

## Encoding Rules:

- **0 views** → Space (no signal)
- **1+ views** → Base3 digit: `(views - 1) % 3`
- Groups of 4 Base3 digits convert to Base36 characters
- Any group containing a space results in a space

## Structure:

    Hours 00-03: 4 Base3 digits → char1
    Hours 04-07: 4 Base3 digits → char2
    ...
    Hours 20-23: 4 Base3 digits → char6

## Example:

To send "HELLO" starting at hour 0:

    H = 7  → Base3: "0021"
    E = 4  → Base3: "0011"
    L = 11 → Base3: "0102"
    L = 11 → Base3: "0102"
    O = 14 → Base3: "0112"

    Hours 00-03: views=1,1,3,2   → "0021" → 'H'
    Hours 04-07: views=1,1,2,2   → "0011" → 'E'
    Hours 08-11: views=1,2,1,3   → "0102" → 'L'
    Hours 12-15: views=1,2,1,3   → "0102" → 'L'
    Hours 16-19: views=1,2,2,3   → "0112" → 'O'

## Technical Notes:

- Base3 encoding with Base36 output
- 4:1 compression (4 hours = 1 character)
- UTC day boundaries only
- Views-only encoding (clones ignored)
