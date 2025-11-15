---
title: OpenTag3D
logo: ./assets/images/logo.svg
layout: splash
permalink: /
header:
  og_image: /assets/images/og_image.jpg
  overlay_color: "#d4c0e7"
  overlay_filter: "0.6"
  overlay_image: /assets/images/background.jpg
  actions:
    - label: "View Spec"
      url: "/spec"
  caption: "Placeholder Background by [**morgaannn23**](https://wallpapercave.com/w/wp6945227)"
excerpt: "An open source standard for 3D printer filament RFID tags. Designed for compatibility between printers, filament manufacturers, and accessories, implementation is simple and low-cost."
intro:
  - excerpt: "Proprietary locks you in. Open sets you free. — [Tim Berners-Lee](https://www.w3.org/People/Berners-Lee/)"
feature_row:
  - title: "Open Standard, Open To All"
    excerpt: "OpenTag3D is 100% open source and designed to work across 3D printer brands, filament makers, accessories, and hobbyist projects. The memory map is openly documented, with no encryption or vendor lock-in, so anyone, from major manufacturers to individual makers, can build, read, and write compatible tags. Additionally, all of the critical data is 100% offline."
    image_path: assets/images/icons8-open_source.svg
    alt: ""
  - title: "Low-Cost, Off-the-Shelf Hardware"
    excerpt: "OpenTag3D uses NTAG213/215/216 NFC tags, the most common and affordable NFC tags on the market. These tags are readable and writable by smartphones, compatible with most off-the-shelf RFID/NFC readers (including low-cost PN532 modules), and require no proprietary hardware."
    image_path: /assets/images/icons8-request_money.svg
    alt: ""
  - title: "Compact Format, Complete Data"
    excerpt: "All the critical data a 3D printer needs (such as manufacturer, material, color, print settings, and more) fits neatly within 144 bytes on an NTAG213. For manufacturers who want to include additional details like serial numbers, production data, or extended specifications, the NTAG215 and NTAG216 provide ample extra space without changing compatibility."
    image_path: /assets/images/icons8-archive.svg
    alt: ""
---

{% include feature_row id="intro" type="center" %}

{% include feature_row %}

RFID tags for 3D printer filament is becoming more prevalent, with every printer manufacturer trying to launch their own RFID standard, both closed and open source. With the ever-growing list of conflicting standards, the 3D printing industry needs a centralized standard that is not controlled by any single company, more than ever. OpenTag3D strives to be that standard as a community-driven specification.

OpenTag3D defines standards for the following:

- **Hardware** - The specific underlying RFID technology
- **Mechanical Requirements** - Positioning of tag on the spool
- **Data Structure** - What data should be stored on the RFID tag, and how that data should be formatted
- **Web API** - How extended data should be formatted when an optional online spool lookup is requested

OpenTag3D is backed by the following projects/companies:

<!-- prettier-ignore-start -->

<ul>
  {%- for b in site.data.backers.backers -%}
    <li><a href="{{ b.url }}">{{ b.name }}</a></li>
  {%- endfor -%}
</ul>

<!-- prettier-ignore-end -->

## Add RFID support to your printer

This standard was designed to be simple to implement in firmware. You will need to add custom firmware and potentially an RFID reader (if your printer doesn't already have one). Make sure to read the [reader implementation guidelines](./spec.md#reader-implementation-guidelines)!

RFID support can theoretically be added to any printer using off-the-shelf RFID Modules such as the PN532 (as low as $3). This module communicates over SPI.

Did you make a design to add RFID to your printer? Let us know so we can link to it here! Designs can be 3D models, or firmware.
