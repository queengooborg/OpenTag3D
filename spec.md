---
title: Specification
layout: single
toc: true
---

# OpenTag3D Standards

Current Version: {{ site.opentag_version }}

{: .notice--danger}
**Notice:** OpenTag3D is not yet production ready. The spec is still being finalized. When it is ready, the version number will become 1.000.

## Hardware Standard

The OpenTag3D standard is designed for the NTAG213/215/216 13.56MHz NFC chips. These tags are cheap and common, and have plenty of space to store the required information. NFC tags can be read/written with smartphones. 13.56 MHz RFID modules are plentiful, low-cost and Arduino-compatible, allowing for easy integration.

| Tag Type | Capacity  | Compatibility   |
| -------- | --------- | --------------- |
| NTAG213  | 144 bytes | Core            |
| NTAG215  | 504 bytes | Core + Extended |
| NTAG216  | 888 bytes | Core + Extended |

<img src="./images/ntag-sticker.jpg" width="200">

NFC NTAG213/215/216 was chosen over MIFARE 1K Classic tags, which is what the Bambu Lab AMS uses, for the following reasons:

- Smartphone Support: NTAG213/215/216 can be read from smartphones, while MF1K requires a dedicated reader
- Backwards Compatible: The RFID hardware used for reading MF1K tags typically supports NTAG tags as well
- Non-Encrypted: MF1K uses 25% of its memory to encrypt the data, which is unsuitable for an open source standard

Originally, the NTAG216 was specifically selected as it had more usable memory (888 bytes) than the MF1K (768 bytes). However, it was later determined that the core data required for functionality could be stored within 144 bytes, and additional data could be stored within 504 bytes.

## Mechanical Standard

The NFC tags should be placed on the spools as follows:

- The center should be 56.0mm away from the center of the spool (see pic)
- The tag should never be more than 4.0mm away from the external surface of the spool
  - For spool sides thicker than 4mm, there must be a cutout to embed the tag, or the tag should be fixed to the outside of the spool
- Two tags should be used, one on each end of the spool, directly across from each other

<img src="./images/TagLocation.png" width="400">

## Data Structure Standard

This is a list of data that will live on the RFID chip, separated into required and optional data. All **REQUIRED** data must be populated to be compliant with this open source RFID protocol.

NTAG213 tags have 144 bytes of usable memory, which is the minimum requirement for OpenTag3D. NTAG216 tags have 888 bytes of usable memory.

All strings are UTF-8 unless specified otherwise. All integers are unsigned, big endian, unless specified otherwise.

Temperatures are stored in Celsius, divided by 5.

### Memory Map - OpenTag3D Core

This is designed to fit within 144 bytes (address 0x10-0x9F), which is for NTAG213, the smallest and cheapest variant of compatible tags.

| Field                 | Unit    | Data Type      | Start Address | Size (bytes) | Usage        | Example                           | Description                                                                                                                                     |
| --------------------- | ------- | -------------- | ------------- | ------------ | ------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Tag Format            | String  | String (ASCII) | 0x10          | 2            | Operational  | `OT`                              | This is always "OT", this helps differentiate between the OpenTag3D and other formats.                                                          |
| Tag Version           | Version | Int            | 0x12          | 2            | Operational  | `1234`                            | RFID tag data format version, with 3 implied decimal points. Eg `1000` → version `1.000`.                                                       |
| Filament Manufacturer | String  | String         | 0x14          | 16           | Display-only | `"Polar Filament"`                | Name of filament manufacturer. Long names should be abbreviated or truncated.                                                                   |
| Base Material Name    | String  | String         | 0x24          | 5            | Display-only | `"PLA"`, `"PETG"`, `"PCTFE"`      | Material name in plain text, excluding any modifiers.                                                                                           |
| Material Modifiers    | String  | String         | 0x29          | 5            | Display-only | `"CF"`, `"HF"`, `"Pro"`, `"Silk"` | Material subcategory or modifier in plain text. Long modifiers may need to be abbreviated.                                                      |
| Color Name            | String  | String         | 0x2E          | 32           | Display-only | `"Blue"`, `"Electric Watermelon"` | Color in plain text.                                                                                                                            |
| Color Hex             | RGBA    | Int[1+1+1+1]   | 0x4E          | 4            | Display-only | `[255, 166, 77, 255]`             | Color stored as 4 separate 1-byte integers for red, green, blue and alpha, in the sRGB color space.                                             |
| Target Diameter       | µm      | Int            | 0x52          | 2            | Operational  | `1750`, `2850`                    | Filament diameter (target) in µm (micrometers). Eg `1750` → `1.750mm`.                                                                          |
| Target Weight         | g       | Int            | 0x54          | 2            | Operational  | `1000`, `5000`, `750`             | Filament weight in grams, excluding spool weight. This is the TARGET weight (e.g., 1kg). Actual measured weight is stored in a different field. |
| Print Temperature     | °C ÷5   | Int            | 0x56          | 1            | Operational  | `42`                              | Recommended print temperature in degrees Celsius, divided by 5. For example, `42` = `210°C`.                                                    |
| Bed Temperature       | °C ÷5   | Int            | 0x57          | 1            | Operational  | `12`, `16`                        | Recommended bed temperature in degrees Celsius, divided by 5. For example, `12` = `60°C`.                                                       |
| Density               | µg      | Int            | 0x58          | 2            | Operational  | `1240`, `3900`                    | Filament density in µg (micrograms) per cubic centimeter. Eg `1240` → `1.240g/cm³`.                                                             |
| RESERVED              | -       | —              | 0x5A–0x6C     | —            | —            | —                                 | Reserved for future use. This goes up to the memory limit of NTAG213.                                                                           |
| Online Data URL       | URL     | String (ASCII) | 0x6D          | 32           | Operational  | `pfil.us?i=8078-RQSR`             | URL to access online JSON additional parameters. Formatted without `https` to save space.                                                       |

### Memory Map - OpenTag3D Extended

This is additional data that not all manufacturers will implement, typically due to technological restrictions.

These fields should be populated if available. All unused fields must be populated with "-1" (all 1's in binary, eg 0xFFFFFFFFFFFFFFFF).

This memory address starts at address 144, which is just outside the range of NTAG213.

| Field                      | Unit    | Data Type  | Start Address | Size (bytes) | Usage        | Example                        | Description                                                           |
| -------------------------- | ------- | ---------- | ------------- | ------------ | ------------ | ------------------------------ | --------------------------------------------------------------------- |
| Serial Number / Batch ID   | String  | String     | 0xA0          | 16           | Display-Only | `1234-ABCD`, `2024-01-23-1234` | Manufacturer's identifier for a spool batch or serial number.         |
| Manufacture Date           | Date    | Int[2+1+1] | 0xB0          | 4            | Display-Only | `[2024, 01, 23]`               | Stored as 2 bytes for year, then 1 byte for month and 1 byte for day. |
| Manufacture Time           | Time    | Int[1+1+1] | 0xB4          | 3            | Display-Only | `[10, 30, 45]`                 | Stored as 1 byte each for hour, minute, and second in 24-hour UTC.    |
| Spool Core Diameter        | mm      | Int        | 0xB7          | 1            | Operational  | `100`, `80`                    | Core diameter in mm (millimeters).                                    |
| MFI Temp                   | °C ÷5   | Int        | 0xB8          | 1            | Operational  | `210`                          | MFI test temperature, divided by 5. For example, `42` = `210ºC`.      |
| MFI Load                   | g ÷10   | Int        | 0xB9          | 1            | Operational  | `216`                          | MFI test load grams, divided by 10. For example, `216` = `2.16kg`.    |
| MFI Value                  | g/10min | Int        | 0xBA          | 1            | Operational  | `63`                           | MFI value, divided by 10.                                             |
| Measured Tolerance         | µm      | Int        | 0xBB          | 1            | Operational  | `20`, `55`                     | Measured tolerance in µm (micrometers).                               |
| Empty Spool Weight         | g       | Int        | 0xBC          | 2            | Operational  | `105`                          | Weight of empty spool in grams.                                       |
| Measured Filament Weight   | g       | Int        | 0xBE          | 2            | Operational  | `1002`                         | Weight of filament only.                                              |
| Measured Filament Length   | m       | Int        | 0xC0          | 2            | Operational  | `336`                          | Length in meters.                                                     |
| TD (Transmission Distance) | µm      | Int        | 0xC2          | 2            | Operational  | `2540`                         | Opaque thickness in µm (micrometers).                                 |
| Max Dry Temp               | °C ÷5   | Int        | 0xC4          | 1            | Operational  | `10`, `11`                     | Max safe drying temp, divided by 5.                                   |
| Dry Time                   | hr      | Int        | 0xC5          | 1            | Operational  | `4`, `8`, `12`                 | Recommended drying time.                                              |
| Min Print Temp             | °C ÷5   | Int        | 0xC6          | 1            | Operational  | `38`                           | Minimum nozzle temp, divided by 5. For example, `38` = `190ºC`.       |
| Max Print Temp             | °C ÷5   | Int        | 0xC7          | 1            | Operational  | `45`                           | Maximum nozzle temp, divided by 5.                                    |
| Min Volumetric Speed       | mm³/s   | Int        | 0xC8          | 1            | Operational  | `20`                           | Min speed recommendation.                                             |
| Max Volumetric Speed       | mm³/s   | Int        | 0xC9          | 1            | Operational  | `120`                          | Max safe speed.                                                       |
| Target Volumetric Speed    | mm³/s   | Int        | 0xCA          | 1            | Operational  | `80`                           | Default recommended speed.                                            |
| RESERVED                   | -       | —          | 0xCB–0x1FF    | —            | —            | —                              | Reserved for future use.                                              |

### Web API Standard

Some tags can contain extended data that doesn't fit or doesn't belong on the RFID tag itself. One example is a diameter graph, which is too much data to be stored within only 888 bytes of memory.

These complex variables can be looked up using the "web API" URL that is stored on the RFID tag.

The format of this data should be JSON.

The web API has not yet been defined for OpenTag3D, as the exact contents of this data are still open to discussion.

## Previous Considerations

These are topics that were heavily discussed during the development of OpenTag3D. Below is a quick summary of each topic, and why we decided to settle on the standards we defined.

- NTAG vs MIFARE
  - NTAG213/215/216 is compatible with smartphones
  - NTAG216 has slightly more usable memory than MIFARE tags
  - MIFARE uses about 25% of memory to encrypt data, preventing read/write operations, which is not applicable for OpenTag3D because of the open-source nature
  - The hardware used for reading MIFARE tags is typically compatible with NTAG tags, meaning existing RFID printer hardware would not need replacement
- JSON vs Memory Map
  - Formats such as JSON (human-readable text) take up considerably more more memory than memory mapped
    - For example, defining something like Printing Temperature would be `PrintTemp:225` which is 13 bytes, instead of storing a memory mapped 2-byte number. Tokens could be reduced, but that also defeats the purpose of using JSON in the first place, which is often for readability
  - NTAG216 tags only have 888 bytes of usable memory, and NTAG213 tags only have 144 bytes, which would be eaten up quickly
    - With memory mapping, the core data was able to easily fit in 144 bytes
- Lookup Tables
  - OpenTag3D does NOT use lookup tables, which would be too difficult to maintain due to the decentralized nature of this standard
  - Lookup tables can quickly become outdated, which would require regular updates to tag readers to make sure they've downloaded the most recent table
  - Storing lookup tables consumes more memory on the device that reads tags
  - On-demand lookup (via the internet) would require someone to host a database
    - Hosting this data would have costs associated with it, and would also put the control of the entire OpenTag3D format in the hands of a single person/company
  - Rather than representing data as a number (such as "company #123 = Example Company), the plain-text company name should be used instead
