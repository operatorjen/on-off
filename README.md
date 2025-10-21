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

- `views = 0` → 'A'
- `views = 1` → 'B' 
- `views = 2` → 'C'
- ...
- `views = 8` → '9'


## Example:

To send "HELLO" starting at hour 14:

    H = 7 → views=7
    E = 4 → views=4
    L = 11 → views=11
    L = 11 → views=11
    O = 14 → views=14

    Hour 14: views=7 → 'H'
    Hour 15: views=4 → 'E'
    Hour 16: views=47 → 'L' (47 % 36 = 11)
    Hour 17: views=47 → 'L'
    Hour 18: views=50 → 'O' (50 % 36 = 14)

## Technical Notes:

- Base36 character set only (A-Z0-9)
- UTC day boundaries only
- Views-only encoding (clones ignored)

## Character Reference

    A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7 I=8 J=9
    K=10 L=11 M=12 N=13 O=14 P=15 Q=16 R=17 S=18 T=19
    U=20 V=21 W=22 X=23 Y=24 Z=25 0=26 1=27 2=28
    3=29 4=30 5=31 6=32 7=33 8=34 9=35

