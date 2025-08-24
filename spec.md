---
title: Specification
layout: single
toc: true
---

# OpenTag3D Standards

Current Version: {{ site.data.spec.version }}

## Hardware Standard

The OpenTag3D standard is designed for the NTAG213/215/216 13.56MHz NFC chips. These tags are cheap and common, and have plenty of space to store the required information. NFC tags can be read/written with smartphones. 13.56 MHz RFID modules are plentiful, low-cost and Arduino-compatible, allowing for easy integration.

| Tag Type | Capacity  | Compatibility   |
| -------- | --------- | --------------- |
| NTAG213  | 144 bytes | Core            |
| NTAG215  | 504 bytes | Core + Extended |
| NTAG216  | 888 bytes | Core + Extended |

<img src="./assets/images/ntag-sticker.jpg" width="200">

NFC NTAG213/215/216 was chosen over MIFARE 1K Classic tags, which is what the Bambu Lab AMS uses, for the following reasons:

- Smartphone Support: NTAG213/215/216 can be read from smartphones, while MF1K requires a dedicated reader
- Backwards Compatible: The RFID hardware used for reading MF1K tags typically supports NTAG tags as well
- Non-Encrypted: MF1K uses 25% of its memory to encrypt the data, which is unsuitable for an open source standard

> [!NOTE]
> Originally, the NTAG216 was specifically selected as it had more usable memory (888 bytes) than the MF1K (768 bytes). However, it was later determined that the core data required for functionality could be stored within 144 bytes, and additional data could be stored within 504 bytes. So, the NTAG213 and NTAG215 were added as cheaper spec-compliant options.

## Mechanical Standard

The NFC tags should be placed on the spools as follows:

- The center should be 56.0mm away from the center of the spool (see pic)
- The tag should never be more than 4.0mm away from the external surface of the spool
  - For spool sides thicker than 4mm, there must be a cutout to embed the tag, or the tag should be fixed to the outside of the spool
- Two tags should be used, one on each end of the spool, directly across from each other

<img src="./assets/images/TagLocation.png" width="400">

## Data Structure Standard

This is a list of data that will live on the RFID chip, separated into required and optional data. All **REQUIRED** data must be populated to be compliant with this open source RFID protocol.

NTAG213 tags have 144 bytes of usable memory, which is the minimum requirement for OpenTag3D. NTAG216 tags have 888 bytes of usable memory.

All strings are UTF-8 unless specified otherwise. All integers are unsigned, big endian, unless specified otherwise.

Temperatures are stored in Celsius, divided by 5.

### Memory Map - OpenTag3D Core

This is designed to fit within the 144 bytes of writable space on the NTAG213, the smallest and cheapest variant of compatible tags.

{% include spec_table.md set="core" %}

### Memory Map - OpenTag3D Extended

This is additional data that not all manufacturers will implement, typically due to technological restrictions.

These fields should be populated if available. All unused fields must be populated with "-1" (all 1's in binary, eg 0xFFFFFFFFFFFFFFFF).

This memory address starts just outside the range of NTAG213; an NTAG215/216 must be used to store this data.

{% include spec_table.md set="extended" %}

### Web API Standard

Sometimes a filament manufacturer may want to include supplemental data for advanced users that doesn't fit or otherwise cannot be stored on the RFID tag itself. One example is a diameter graph, which is too much data to be stored within only 888 bytes of memory. OpenTag3D defines a field for a "web API" URL which can be used to look up this information.

> [!NOTE]
> The web API will only be used for advanced supplemental data and will never be used for critical information required by printers in order to print the material property.

At this time, the web API is only a placeholder for future implementation, as the OpenTag3D specification has not determined what information should be included in the web API standard. For now, it only defines the structure.

The "Online Data URL" field should be populated with the URL that responds with the web API data. The URL must return JSON data when the `Accept` HTTP header is set to `application/json`. Implementers are welcome to create a user-friendly UI if the `Accept` header is set to anything else, but it _must_ return JSON format if the client calls for it.

The URL should respond with the following JSON:

```json
{
  "opentag_version": "{{ site.spec.data.version }}"
}
```

## Reader Implementation Guidelines

While every implementation for reading OpenTag3D RFID tags will be different, this specification aims to set a few requirements to ensure that functionality is consistent across printers and other hardware -- we'll call these the "reader" for continuity.

When attempting to read an RFID tag, the reader should check for the presence of the tag format field and check if it is "OT" (0x4F54). If it is not set to "OT", it is not an OpenTag3D tag.

The reader should then check the tag version. If the tag version is a newer _minor_ version than the reader expects, display a warning to the user and attempt to parse anyways. If the tag version is a newer _major_ version, the reader should display an error to the user and not attempt to parse the data.

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
  - Rather than representing data as a number (such as "company #123 = Example Company"), the plain-text company name should be used instead
