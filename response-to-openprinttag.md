---
title: Response to OpenPrintTag
layout: single
description: What does the release of OpenPrintTag mean for OpenTag3D?
---

In late October 2025, Prusa announced a new open source standard for 3D printer filament RFID tags called [OpenPrintTag](https://openprinttag.org/). This standard has the same mission that OpenTag3D does: to break the cycle of proprietary RFID tags for filament. While it is still in early development stages, it has gained widespread interest from many parties.

Of course, now that this new standard has been announced, this begs the question: what does this mean for OpenTag3D?

In summary, at this time, I don't plan to stop development on the OpenTag3D specification. I'm still going to be updating and improving it, if only to provide a potential alternative to OpenPrintTag. Ultimately, though, my hope is that everyone in the 3D printing industry and community will agree on a single standard, whether that's OpenTag3D, OpenPrintTag, or something else -- after all, nothing can become _the_ standard if we're all competing.

－ Vinyl Da.i'gyu

---

Update November 16, 2025:

After carefully reviewing the OpenPrintTag specification, it appears that at this time, the data storage method will not conflict with that of OpenPrintTag. Because both specifications use the NDEF record format, and both allow a tag to store more records, a filament manufacturer can store _both_ formats on the same tag.

The only potential conflict is the mechanical/hardware standards. While OpenPrintTag does not define a mechanical standard at this time, its page discusses a circular tag layout that is placed on the inside of the spool, as well as a single tag. Since both specifications are still in early development, this may change down the line.
