# On / Off

Signaling games

## Encoding Rules:

- Each UTC hour encodes 2 ASCII characters
- character = (traffic_count % 128)
- 24-hour cycle = 48 characters maximum

## Structure:

    Hour 00: clones→char1, views→char2
    Hour 01: clones→char3, views→char4
    ...
    Hour 23: clones→char47, views→char48

## Example:

To send "HELLO" starting at hour 14:

    Hour 14: clones=72 ('H'), views=69 ('E')
    Hour 15: clones=76 ('L'), views=76 ('L')
    Hour 16: clones=79 ('O'), views=32 (' ')

Technical Notes:

    7-bit ASCII only (0-127)
    UTC day boundaries only
