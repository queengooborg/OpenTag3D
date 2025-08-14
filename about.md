---
title: About
layout: single
toc: true
---

# History

The OpenTag3D protocol, initially called "Open 3D-RFID", was originally incubated by the Bambu Research Group, a group dedicated to researching and reverse engineering the tag data from Bambu Lab's RFID tags. When the RFID tags were launched with Bambu Lab spools using a proprietary, encrypted format, the group knew that it was only a matter of time before other brands released their own proprietary formats.

As the OpenTag3D protocol began to reach maturity, it was later moved to its own repository, where it continues to incubate to this day.

# Backers

These are companies that are implementing OpenTag3D into their printers, filament, add-ons, etc. If you would like to join this list, please open an [Issue on GitHub](https://github.com/queengooborg/OpenTag3D/issues/new).

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

# OpenTag3D Consortium

The OpenTag3D Consortium is a collaborative group of 3D printing companies, hobbyists, RFID experts, and other stakeholders committed to maintaining and evolving the OpenTag3D RFID standard specification. The consortium operates under a structured membership model, ensuring a balance of inclusivity and effective decision-making.

## Voting Members

Voting members play a critical role in the governance of the OpenTag3D standard. They have the authority to vote on proposals related to modifying the specification. Their decisions shape the future direction of OpenTag3D, ensuring it meets the needs of the community and industry.

To maintain fairness and inclusivity, the voting seats are divided equally between:

- Industry Representatives: Voting members representing companies and organizations involved in 3D printing, RFID, and related fields.
- Community Representatives: Voting members from the broader community, including hobbyists, independent developers, and RFID experts.

This balanced structure ensures that no single group dominates decision-making, fostering a standard that reflects the interests of both professional and grassroots contributors.

## Non-Voting Members

Non-voting members are integral to the consortium's ecosystem, contributing ideas and fostering collaboration. While they cannot directly vote on proposals, they can:

- **Propose Changes**: Submit new ideas or modifications to the specification, which voting members will evaluate and vote on.
- **Elect Voting Members**: Participate in elections to select voting members through a popular vote, ensuring representation aligns with the community’s vision.
  This dual-tier structure enables broad participation while maintaining an efficient and organized decision-making process.
