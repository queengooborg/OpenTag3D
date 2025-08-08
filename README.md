# OpenTag3D: Open Source Filament RFID Standard

_Current Version: 0.001_

RFID is becoming more prevalent, with each company launching their own RFID system that is incompatible with the rest.
OpenTag strives to be a standard that allows RFID tags to work across 3D Printer Brands, Filament Brands, and Accessory Brands.

OpenTag3D aims to standardize the following:

- **Hardware** - The specific underlying RFID technology
- **Mechanical Requirements** - Positioning of tag on the spool
- **Data Structure** - What data should be stored on the RFID tag, and how that data should be formatted
- **Web API** - How extended data should be formatted when an optional online spool lookup is requested

<img src="./images/SpoolTag.jpg" height=300>

# Table of Contents

<!-- prettier-ignore-start -->

<!--ts-->
* [Backers](#backers)
* [Why RFID?](#why-rfid)
* [Add RFID support to your printer](#add-rfid-support-to-your-printer)
* [OpenTag3D Standards](#opentag3d-standards)
   * [Hardware Standard](#hardware-standard)
   * [Mechanical Standard](#mechanical-standard)
   * [Data Structure Standard](#data-structure-standard)
      * [Memory Map - OpenTag3D Lite](#memory-map---opentag3d-lite)
      * [Memory Map - Extended Data](#memory-map---extended-data)
      * [Web API Standard](#web-api-standard)
   * [OpenTag3D Consortium](#opentag3d-consortium)
      * [Voting Members](#voting-members)
      * [Non-Voting Members](#non-voting-members)
   * [Previous Considerations](#previous-considerations)
<!--te-->

<!-- prettier-ignore-end -->

# History

The OpenTag3D protocol, initially called "Open 3D-RFID", was originally incubated by the Bambu Research Group, a group dedicated to researching and reverse engineering the tag data from Bambu Lab's RFID tags. When the RFID tags were launched with Bambu Lab spools using a proprietary, encrypted format, the group knew that it was only a matter of time before other brands released their own proprietary formats.

As the OpenTag3D protocol began to reach maturity, it was later moved to its own repository, where it continues to incubate to this day.

# Backers

These are companies that are implementing OpenTag3D into their printers, filament, add-ons, etc. If you would like to join this list, please open an Issue on GitHub.

- Filament Manufacturers:
  - [Polar Filament](https://polarfilament.com) (Backed 2024-02-25)
  - [Ecogenesis Biopolymers](https://ecogenesisbiopolymers.com) (Backed 2024-09-20)
  - [3D Fuel](https://www.3dfuel.com/) (Backed 2024-10-30)
  - [Numakers](https://numakers.com/) (Backed 2024-11-24)
  - [American Filament](https://americanfilament.us) (Backed 2025-01-20)
- Printers + Hardware:
  - [OpenSpool](https://www.youtube.com/watch?v=ah7dm-dtQ5w) ([GitHub Source](https://github.com/spuder/OpenSpool)) (Backed 2024-10-23)
  - [Cosmyx](https://www.cosmyx3d.com/) (Backed 2024-10-30)
  - [Distrifab](https://distrifab.fr/) (Backed 2024-10-30)

# Why RFID?

What is the benefit of adding RFID chips to filament?

- AMS / Multi-Material Printers
  - **Color + Material ID:** Simplifying the painting process! AMS units can automatically detect what filament is loaded up in each slot. This also adds a sanity check before you start printing to make sure you don't end up with a print in the wrong color.
- High-Speed Printing
  - **Advanced Filament Data:** Tags can store advanced per-spool printing data, such as printing/bed temps, melt-flow index, retration, and even filament diameter graphs. This would make the transition simpler when using filaments from different brands.
- HueForge
  - **Transmission distance + Hex**: Each spool can have a unique TD and color. Saving this data on the spool allows for more accurate tuning, and less math for the consumer
- Every Printer
  - **Filament Remaining Estimation:** Using the RFID tag as an encoder, printers can measure how long it takes for one rotation of a spool of filament, and use this to estimate how much filament is remaining.
  - **Print Profiles**: Each spool can contain print/bed temps, as well as other settings like retraction settings. This makes it much easier to use different brands/colors/materials without worrying about creating a bunch of different slicer profiles.

# Add RFID support to your printer

This standard was designed to be simple to implement in firmware. You will need to add custom firmware and potentially an RFID reader (if your printer doesn't already have one).

RFID support can theoretically be added to any printer using off-the-shelf RFID Modules such as the PN532 (as low as $3). This module communicates over SPI.

<img src="./images/PN532-Reader-Blue.png" width=200>
<img src="./images/PN532-Reader-Red.png" width=200>

Did you make a design to add RFID to your printer? Let us know so we can link to it here! Designs can be 3D models, or firmware.

# OpenTag3D Standards

## Hardware Standard

The OpenTag3D standard is designed for the NTAG213/215/216 13.56MHz NFC chips. These tags are cheap and common, and have plenty of space to store the required information. NFC tags can be read/written with smartphones. 13.56 MHz RFID modules are plentiful, low-cost and Arduino-compatible, allowing for easy integration.

| Tag Type | Capacity  | Compatibility           |
| -------- | --------- | ----------------------- |
| NTAG213  | 144 bytes | OpenTag Lite            |
| NTAG215  | 504 bytes | OpenTag Lite + Extended |
| NTAG216  | 888 bytes | OpenTag Lite + Extended |

<img src="./images/mifareclassicsticker.jpg" width="200">

NFC NTAG213/215/216 was chosen over MIFARE 1K Classic tags, which is what the Bambu Lab AMS uses, for the following reasons:

- Smartphone Support: NTAG213/215/216 can be read from smartphones, while MF1K requires a dedicated reader
- Backwards Compatible: The RFID hardware used for reading MF1K tags typically supports NTAG tags as well
- Non-Encrypted: MF1K uses 25% of its memory to encrypt the data, which is unsuitable for an open source standard

Originally, the NTAG216 was specifically selected as it had more usable memory (888 bytes) than the MF1K (768 bytes). However, it was later determined that the core data required for functionality could be stored within 144 bytes.

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

### Memory Map - OpenTag3D Lite

This is designed to fit within 144 bytes (address 0x10-0x9F), which is for NTAG213, the smallest and cheapest variant of compatible tags.
All strings are UTF-8 unless specified otherwise.
All integers are unsigned, big endian, unless specified otherwise.

| Field                   | Data Type      | Start Address | Size (bytes) | Usage        | Example                           | Description                                                                                                                                                                                     |
| ----------------------- | -------------- | ------------- | ------------ | ------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tag Format              | String         | 0x10          | 2            | Operational  | `OT`                              | This is always "OT", this helps differentiate between the OpenTag3D and other formats. If a tag doesn't start with "OT", it is not OpenTag3D format.                                            |
| Tag Version             | Int            | 0x12          | 2            | Operational  | `1234`                            | RFID tag data format version to allow future compatibility in the event that the data format changes dramatically. Stored as an int with 3 implied decimal points. Eg `1000` → version `1.000`. |
| Filament Manufacturer   | String         | 0x14          | 16           | Display-only | `"Polar Filament"`                | String representation of filament manufacturer. 16 bytes is the max data length per block. Longer names will be abbreviated or truncated.                                                       |
| Base Material Name      | String         | 0x24          | 5            | Display-only | `"PLA"`, `"PETG"`, `"PCTFE"`      | Material name in plain text, excluding any modifiers.                                                                                                                                           |
| Material Modifiers      | String         | 0x29          | 5            | Display-only | `"CF"`, `"HF"`, `"Pro"`, `"Silk"` | Material subcategory or modifier in plain text to give more context to the base material. Long modifiers may need to be abbreviated.                                                            |
| Color Name              | String         | 0x2E          | 32           | Display-only | `"Blue"`, `"Electric Watermelon"` | Color in plain text.                                                                                                                                                                            |
| Color RGB               | Int[1+1+1]     | 0xC4          | 3            | Display-only | `[255, 166, 77]`                  | Color stored as 3 separate 1-byte integers for red, green, and blue, in the sRGB color space. This is used for UI previews or rendering.                                                        |
| Diameter (Target)       | Int            | 0x4E          | 2            | Operational  | `1750`, `2850`                    | Filament diameter (target) in µm (micrometers). Eg `1750` → `1.750mm`.                                                                                                                          |
| Weight (Nominal, grams) | Int            | 0x50          | 2            | Operational  | `1000`, `5000`, `750`             | Filament weight in grams, excluding spool weight. This is the TARGET weight (e.g., 1kg). Actual measured weight is stored in a different field.                                                 |
| Print Temp (×5 °C)      | Int            | 0x52          | 1            | Operational  | `42`                              | Recommended print temperature in degrees Celsius, stored as 5× the actual value. For example, `42` represents `210°C`.                                                                          |
| Bed Temp (×5 °C)        | Int            | 0x53          | 1            | Operational  | `12`, `16`                        | Recommended bed temperature in degrees Celsius, stored as 5× the actual value. For example, `12` = `60°C`.                                                                                      |
| Density                 | Int            | 0x56          | 2            | Operational  | `1240`, `3900`                    | Filament density in µg (micrograms) per cubic centimeter. Eg `1240` → `1.240g/cm³`.                                                                                                             |
| RESERVED                | —              | 0x58–0x6C     | —            | —            | —                                 | Reserved for future use. This goes up to the memory limit of NTAG213.                                                                                                                           |
| Online Data URL         | String (ASCII) | 0x6D          | 32           | Operational  | `pfil.us?i=8078-RQSR`             | URL to access online JSON additional parameters. Formatted without `https` to save space.                                                                                                       |

### Memory Map - Extended Data

This is additional data that not all manufacturers will implement, typically due to technological restrictions. These fields are populated if available. All unused fields must be populated with "-1" (all 1's in binary, eg 0xFFFFFFFFFFFFFFFF)
This memory address starts at address 144, which is just outside the range of NTAG213.

| Field                            | Data Type  | Start Address | Size (bytes) | Usage        | Example                        | Description                                                                                    |
| -------------------------------- | ---------- | ------------- | ------------ | ------------ | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Serial Number / Batch ID         | String     | 0xA0          | 16           | Display-Only | `1234-ABCD`, `2024-01-23-1234` | Identifier for a spool batch or serial number. Format varies from manufacturer to manufacturer |
| Manufacture Date (Y, M, D)       | Int[2+1+1] | 0xB0          | 4            | Display-Only | `[2024, 01, 23]`               | Stored as 2 bytes for year, then 1 byte for month and 1 byte for day.                          |
| Manufacture Time (H, M, S, UTC)  | Int[1+1+1] | 0xB4          | 3            | Display-Only | `[10, 30, 45]`                 | Stored as 1 byte each for hour, minute, and second in 24-hour UTC.                             |
| Spool Core Diameter (mm)         | Int        | 0xB7          | 1            | Operational  | `100`, `80`                    | Core diameter in mm.                                                                           |
| MFI Temp (°C)                    | Int        | 0xB8          | 1            | Operational  | `210`                          | MFI test temperature.                                                                          |
| MFI Load (×100g)                 | Int        | 0xB9          | 1            | Operational  | `216`                          | MFI test load (e.g. 216 = 2.16kg).                                                             |
| MFI Value (×10 g/10min)          | Int        | 0xBA          | 1            | Operational  | `63`                           | MFI ×10 value.                                                                                 |
| Tolerance (Measured)             | Int        | 0xBB          | 1            | Operational  | `20`, `55`                     | Measured tolerance in µm.                                                                      |
| Empty Spool Weight (g)           | Int        | 0xBC          | 2            | Operational  | `105`                          | Weight of empty spool.                                                                         |
| Filament Weight (Measured)       | Int        | 0xBE          | 2            | Operational  | `1002`                         | Weight of filament only.                                                                       |
| Filament Length (Measured)       | Int        | 0xC0          | 2            | Operational  | `336`                          | Length in meters.                                                                              |
| TD (Transmission Distance)       | Int        | 0xC2          | 2            | Operational  | `2540`                         | Opaque thickness in µm.                                                                        |
| Max Dry Temp (°C)                | Int        | 0xC4          | 1            | Operational  | `50`, `55`                     | Max safe drying temp.                                                                          |
| Dry Time (Hours)                 | Int        | 0xC5          | 1            | Operational  | `4`, `8`, `12`                 | Recommended drying time.                                                                       |
| Min Print Temp (°C)              | Int        | 0xC6          | 1            | Operational  | `190`                          | Minimum nozzle temp.                                                                           |
| Max Print Temp (°C)              | Int        | 0xC7          | 1            | Operational  | `225`                          | Maximum nozzle temp.                                                                           |
| Volumetric Speed Min (×10 mm³/s) | Int        | 0xC8          | 1            | Operational  | `20`                           | Min speed recommendation.                                                                      |
| Volumetric Speed Max (×10 mm³/s) | Int        | 0xC9          | 1            | Operational  | `120`                          | Max safe speed.                                                                                |
| Volumetric Speed Recommended     | Int        | 0xCA          | 1            | Operational  | `80`                           | Default recommended speed.                                                                     |
| RESERVED                         | —          | 0xCB–0x1FF    | —            | —            | —                              | Reserved for future use.                                                                       |

### Web API Standard

Some tags can contain extended data that doesn't fit or doesn't belong on the RFID tag itself. One example is a diameter graph, which is too much data to be stored within only 888 bytes of memory.

These complex variables can be looked up using the "web API" URL that is stored on the RFID tag.

The format of this data should be JSON.
The exact contents of this data are still open to discussion, and it is not required to launch the OpenTag3D standard. The web API can be implemented in the future without affecting the launch of OpenTag3D.

## OpenTag3D Consortium

The OpenTag3D Consortium is a collaborative group of 3D printing companies, hobbyists, RFID experts, and other stakeholders committed to maintaining and evolving the OpenTag3D RFID standard specification. The consortium operates under a structured membership model, ensuring a balance of inclusivity and effective decision-making.

### Voting Members

Voting members play a critical role in the governance of the OpenTag3D standard. They have the authority to vote on proposals related to modifying the specification. Their decisions shape the future direction of OpenTag3D, ensuring it meets the needs of the community and industry.

To maintain fairness and inclusivity, the voting seats are divided equally between:

- Industry Representatives: Voting members representing companies and organizations involved in 3D printing, RFID, and related fields.
- Community Representatives: Voting members from the broader community, including hobbyists, independent developers, and RFID experts.

This balanced structure ensures that no single group dominates decision-making, fostering a standard that reflects the interests of both professional and grassroots contributors.

### Non-Voting Members

Non-voting members are integral to the consortium's ecosystem, contributing ideas and fostering collaboration. While they cannot directly vote on proposals, they can:

- **Propose Changes**: Submit new ideas or modifications to the specification, which voting members will evaluate and vote on.
- **Elect Voting Members**: Participate in elections to select voting members through a popular vote, ensuring representation aligns with the community’s vision.
  This dual-tier structure enables broad participation while maintaining an efficient and organized decision-making process.

## Previous Considerations

These are topics that are commonly brought up when learning about OpenTag3D. Below is a quick summary of each topic, and why we decided to settle on the standards we defined.

- NTAG216 vs MIFARE:
  - NTAG216 is compatible with smartphones and has slightly more usable memory than MIFARE tags
  - MIFARE uses about 25% of memory to encrypt data, preventing read/write operations, which is not applicable for OpenTag3D because of the open-source nature
- JSON vs Memory Map:
  - Formats such as JSON (human-readable text) takes up considerably more more memory than memory mapped. For example, defining something like Printing Temperature would be `PrintTemp:225` which is 13 bytes, instead of storing a memory mapped 2-byte number. Tokens could be reduced, but that also defeats the purpose of using JSON in the first place, which is often for readability.
  - NTAG216 tags only have 888 bytes of usable memory, which would be eaten up quickly
- Lookup Tables
  - OpenTag3D does NOT use lookup tables, which would be too difficult to maintain due to the decentralized nature of this standard.
  - Lookup tables can quickly become outdated, which would require regular updates to tag readers to make sure they've downloaded the most recent table.
  - Storing lookup tables consumes more memory on the device that reads tags
  - On-demand lookup (via the internet) would require someone to host a database. Hosting this data would have costs associated with it, and would also put the control of the entire OpenTag3D format in the hands of a single person/company
  - Rather than representing data as a number (such as "company #123 = Example Company), the plain-text company name should be used instead
