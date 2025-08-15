---
title: OpenTag3D
layout: splash
permalink: /
header:
  overlay_color: "#000"
  overlay_filter: "0.5"
  # overlay_image: /assets/images/unsplash-image-1.jpg
  actions:
    - label: "View Spec"
      url: "/spec"
  # caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
excerpt: "An open source standard for 3D printer filament RFID tags. Designed for compatibility between printers, filament manufacturers, and accessories, implementation is simple and low-cost."
intro:
  - excerpt: "Proprietary locks you in. Open sets you free. — [Tim Berners-Lee](https://www.w3.org/People/Berners-Lee/)"
feature_row:
  - title: "Open Standard, Open To All"
    excerpt: "No more proprietary, locked-down filament tags. OpenTag3D works across 3D printer brands, filament makers, accessories, and hobbyist projects. The memory map is openly documented, with no encryption or vendor lock-in, so anyone, from major manufacturers to individual makers, can build, read, and write compatible tags."
    # image_path: assets/images/unsplash-gallery-image-1-th.jpg
    alt: ""
  - title: "Low-Cost, Off-the-Shelf Hardware"
    excerpt: "OpenTag3D uses NTAG213/215/216 NFC tags, the most common and affordable NFC tags on the market. These tags are readable and writable by smartphones, compatible with most off-the-shelf RFID/NFC readers (including low-cost PN532 modules), and require no proprietary hardware."
    # image_path: /assets/images/unsplash-gallery-image-2-th.jpg
    alt: ""
  - title: "Compact Format, Complete Data"
    excerpt: "All the critical data a 3D printer needs (such as manufacturer, material, color, print settings, and more) fits neatly within 144 bytes on an NTAG213. For manufacturers who want to include additional details like serial numbers, production data, or extended specifications, the NTAG215 and NTAG216 provide ample extra space without changing compatibility."
    # image_path: /assets/images/unsplash-gallery-image-3-th.jpg
    alt: ""
---

{% include feature_row id="intro" type="center" %}

{% include feature_row %}

RFID is becoming more prevalent, with each company launching their own RFID system that is incompatible with the rest. OpenTag3D strives to be a standard that allows RFID tags to work across all brands.

OpenTag3D defines a standard for the following:

- **Hardware** - The specific underlying RFID technology
- **Mechanical Requirements** - Positioning of tag on the spool
- **Data Structure** - What data should be stored on the RFID tag, and how that data should be formatted
- **Web API** - How extended data should be formatted when an optional online spool lookup is requested

Backed by several companies:

<!-- prettier-ignore-start -->

<ul>
  {%- for b in site.data.backers.backers -%}
    <li><a href="{{ b.url }}">{{ b.name }}</a></li>
  {%- endfor -%}
</ul>

<!-- prettier-ignore-end -->
