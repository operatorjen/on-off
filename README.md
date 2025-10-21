# On / Off

Signaling protocol :::::::

## Encoding Rules:

- Each UTC hour encodes **one Base36 character** using only view counts
- Character set: `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`
- 24-hour cycle = 24 characters maximum
- **Views range: 0-8** (maps directly to characters)

## Structure:

    Hour 00: views(0-8) → char1
    Hour 01: views(0-8) → char2
    ...
    Hour 23: views(0-8) → char24

## How to Encode

**Direct mapping:**

- `views = 1` → 'A'
- `views = 2` → 'B' 
- `views = 3` → 'C'
- ...
- `views = 35` → '9'


## Example:

To send "HELLO" starting at hour 14:

    H = 8th letter  -> 8 views
    E = 5th letter  -> 5 views
    L = 12th letter -> 12 views
    L = 12th letter -> 12 views
    O = 15th letter -> 15 views

    Hour 14: views=8   → 'H'
    Hour 15: views=5   → 'E'
    Hour 16: views=12  → 'L'
    Hour 17: views=12  → 'L'
    Hour 18: views=15  → 'O'

## Technical Notes:

- Base36 character set only (A-Z0-9)
- UTC day boundaries only
- Views-only encoding (clones ignored)

## Character Reference

    0: space (no view)
    1: A, 2: B, 3: C, 4: D, 5: E, 6: F, 7: G, 8: H, 9: I, 10: J,
    11: K, 12: L, 13: M, 14: N, 15: O, 16: P, 17: Q, 18: R, 19: S, 20: T,
    21: U, 22: V, 23: W, 24: X, 25: Y, 26: Z,
    27: 0, 28: 1, 29: 2, 30: 3, 31: 4, 32: 5, 33: 6, 34: 7, 35: 8, 36: 9

