import React, { useMemo, useState } from "react";

// OpenTag3D Tag Image Builder (NTAG213/215/216)
// - Generates a binary image starting at address 0x10 (contiguous up to the highest populated byte)
// - Exports JSON/CSV address maps
// - Validates sizes, ranges, encoding, collisions, and capacity
// - Core fits NTAG213 (0x10–0x9F); Extended from 0xA0+ for NTAG215/216
// - Strings are UTF‑8, zero‑padded; ASCII enforced for URL
// - Unsigned big‑endian integers; scaled fields per spec

const CORE_START = 0x10;
const CORE_END = 0x9f; // inclusive
const EXT_START = 0xa0; // inclusive
const EXT_END = 0x1ff; // inclusive (upper bound from table)

const TAG_CAPACITY = {
  NTAG213: 144, // bytes usable from 0x10
  NTAG215: 504,
  NTAG216: 888,
} as const;

// ---------- helpers ----------
function bePack(value: number, bytes: number): number[] {
  if (value < 0) throw new Error("Negative integers not allowed");
  const out = new Array(bytes).fill(0);
  for (let i = bytes - 1; i >= 0; i--) {
    out[i] = value & 0xff;
    value >>>= 8;
  }
  return out;
}

function encodeStringUTF8(
  str: string,
  size: number,
  asciiOnly = false,
): number[] {
  if (asciiOnly && /[^\x00-\x7F]/.test(str)) {
    throw new Error("Non-ASCII character detected in an ASCII-only field");
  }
  const enc = new TextEncoder();
  const bytes = Array.from(enc.encode(str));
  const out = new Array(size).fill(0);
  for (let i = 0; i < Math.min(size, bytes.length); i++) out[i] = bytes[i];
  return out; // zero-padded
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function hex(n: number, pad = 2) {
  return "0x" + n.toString(16).toUpperCase().padStart(pad, "0");
}

function toHexBytes(arr: number[]) {
  return arr.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join("");
}

// ---------- types ----------

type TagType = keyof typeof TAG_CAPACITY;

type FieldKind = "str" | "int" | "intScaled" | "rgba" | "dateYMD" | "timeHMS";

interface FieldDefBase {
  key: string;
  label: string;
  addr: number; // all fields now have fixed addresses per spec
  size: number; // in bytes
  region: "core" | "ext";
  kind: FieldKind;
  note?: string;
  asciiOnly?: boolean;
}

interface IntScaled extends FieldDefBase {
  kind: "intScaled";
  scale: number;
}
interface IntPlain extends FieldDefBase {
  kind: "int";
}
interface StrField extends FieldDefBase {
  kind: "str";
}
interface RGBField extends FieldDefBase {
  kind: "rgba";
}
interface DateField extends FieldDefBase {
  kind: "dateYMD";
}
interface TimeField extends FieldDefBase {
  kind: "timeHMS";
}

type FieldDef =
  | IntPlain
  | IntScaled
  | StrField
  | RGBField
  | DateField
  | TimeField;

// ---------- field map from the spec ----------
const ALL_FIELDS: FieldDef[] = [
  {
    key: "tagFormat",
    label: "Tag Format",
    addr: 0x10,
    size: 2,
    region: "core",
    kind: "str",
    note: 'Always "OT"',
  },
  {
    key: "tagVersion",
    label: "Tag Version (e.g. 1.000)",
    addr: 0x12,
    size: 2,
    region: "core",
    kind: "intScaled",
    note: "Stored as integer ×1000",
    scale: 1000,
  },
  {
    key: "manufacturer",
    label: "Filament Manufacturer",
    addr: 0x14,
    size: 16,
    region: "core",
    kind: "str",
  },
  {
    key: "baseMaterial",
    label: "Base Material Name",
    addr: 0x24,
    size: 5,
    region: "core",
    kind: "str",
  },
  {
    key: "materialMods",
    label: "Material Modifiers",
    addr: 0x29,
    size: 5,
    region: "core",
    kind: "str",
  },
  {
    key: "colorName",
    label: "Color Name",
    addr: 0x2e,
    size: 32,
    region: "core",
    kind: "str",
  },
  {
    key: "colorRGBA",
    label: "Color Hex RGBA [R,G,B,A]",
    addr: 0x4e,
    size: 4,
    region: "core",
    kind: "rgba",
    note: "sRGB; 4 separate bytes",
  },
  {
    key: "diameter",
    label: "Diameter Target (mm)",
    addr: 0x52,
    size: 2,
    region: "core",
    kind: "intScaled",
    scale: 1000,
    note: "Stored in µm (×1000)",
  },
  {
    key: "weightNom",
    label: "Weight Nominal (g)",
    addr: 0x54,
    size: 2,
    region: "core",
    kind: "int",
  },
  {
    key: "printTemp",
    label: "Print Temp (°C)",
    addr: 0x56,
    size: 1,
    region: "core",
    kind: "intScaled",
    scale: 0.2,
    note: "Stored as °C/5 (divide by 5)",
  },
  {
    key: "bedTemp",
    label: "Bed Temp (°C)",
    addr: 0x57,
    size: 1,
    region: "core",
    kind: "intScaled",
    scale: 0.2,
    note: "Stored as °C/5 (divide by 5)",
  },
  {
    key: "density",
    label: "Density (g/cm³)",
    addr: 0x58,
    size: 2,
    region: "core",
    kind: "intScaled",
    scale: 1000,
  },
  {
    key: "dataUrl",
    label: "Online Data URL (ASCII, no protocol)",
    addr: 0x6d,
    size: 32,
    region: "core",
    kind: "str",
    asciiOnly: true,
    note: "e.g. pfil.us?i=8078-RQSR",
  },
  {
    key: "serial",
    label: "Serial / Batch ID",
    addr: 0xa0,
    size: 16,
    region: "ext",
    kind: "str",
  },
  {
    key: "mfgDate",
    label: "Manufacture Date (YYYY-MM-DD)",
    addr: 0xb0,
    size: 4,
    region: "ext",
    kind: "dateYMD",
  },
  {
    key: "mfgTime",
    label: "Manufacture Time (HH:MM:SS UTC)",
    addr: 0xb4,
    size: 3,
    region: "ext",
    kind: "timeHMS",
  },
  {
    key: "coreDia",
    label: "Spool Core Diameter (mm)",
    addr: 0xb7,
    size: 1,
    region: "ext",
    kind: "int",
  },
  {
    key: "mfiTemp",
    label: "MFI Temp (°C)",
    addr: 0xb8,
    size: 1,
    region: "ext",
    kind: "int",
  },
  {
    key: "mfiLoad",
    label: "MFI Load (×100 g)",
    addr: 0xb9,
    size: 1,
    region: "ext",
    kind: "int",
  },
  {
    key: "mfiValue",
    label: "MFI Value (×10 g/10min)",
    addr: 0xba,
    size: 1,
    region: "ext",
    kind: "int",
  },
  {
    key: "tolerance",
    label: "Tolerance (µm, measured)",
    addr: 0xbb,
    size: 1,
    region: "ext",
    kind: "int",
  },
  {
    key: "spoolEmpty",
    label: "Empty Spool Weight (g)",
    addr: 0xbc,
    size: 2,
    region: "ext",
    kind: "int",
  },
  {
    key: "filWeight",
    label: "Filament Weight (measured, g)",
    addr: 0xbe,
    size: 2,
    region: "ext",
    kind: "int",
  },
  {
    key: "filLen",
    label: "Filament Length (m)",
    addr: 0xc0,
    size: 2,
    region: "ext",
    kind: "int",
  },
  {
    key: "td",
    label: "TD (Transmission Distance, µm)",
    addr: 0xc2,
    size: 2,
    region: "ext",
    kind: "int",
  },
  {
    key: "maxDryTemp",
    label: "Max Dry Temp (°C)",
    addr: 0xc4,
    size: 1,
    region: "ext",
    kind: "int",
  },
  {
    key: "dryTime",
    label: "Dry Time (hours)",
    addr: 0xc5,
    size: 1,
    region: "ext",
    kind: "int",
  },
  {
    key: "minPrintTemp",
    label: "Min Print Temp (°C)",
    addr: 0xc6,
    size: 1,
    region: "ext",
    kind: "int",
  },
  {
    key: "maxPrintTemp",
    label: "Max Print Temp (°C)",
    addr: 0xc7,
    size: 1,
    region: "ext",
    kind: "int",
  },
  {
    key: "vMin",
    label: "Vol. Speed Min (×10 mm³/s)",
    addr: 0xc8,
    size: 1,
    region: "ext",
    kind: "int",
  },
  {
    key: "vMax",
    label: "Vol. Speed Max (×10 mm³/s)",
    addr: 0xc9,
    size: 1,
    region: "ext",
    kind: "int",
  },
  {
    key: "vRec",
    label: "Vol. Speed Rec (×10 mm³/s)",
    addr: 0xca,
    size: 1,
    region: "ext",
    kind: "int",
  },
];

const coreFields = ALL_FIELDS.filter((f) => f.region === "core");
const extFields = ALL_FIELDS.filter((f) => f.region === "ext");

// ---------- UI ----------
export default function App() {
  const [tagType, setTagType] = useState<TagType>("NTAG213");

  // Values (example defaults)
  const [values, setValues] = useState<Record<string, any>>({
    tagFormat: "OT",
    tagVersion: "1.000",
    manufacturer: "Polar Filament",
    baseMaterial: "PLA",
    materialMods: "CF",
    colorName: "Blue",
    colorRGBA: "255,166,77,255",
    diameter: 1.75,
    weightNom: 1000,
    printTemp: 210,
    bedTemp: 60,
    density: 1.24,
    dataUrl: "pfil.us?i=8078-RQSR",
    serial: null,
    mfgDate: null,
    mfgTime: null,
    coreDia: null,
    mfiTemp: null,
    mfiLoad: null,
    mfiValue: null,
    tolerance: null,
    spoolEmpty: null,
    filWeight: null,
    filLen: null,
    td: null,
    maxDryTemp: null,
    dryTime: null,
    minPrintTemp: null,
    maxPrintTemp: null,
    vMin: null,
    vMax: null,
    vRec: null,
  });

  const capacity = TAG_CAPACITY[tagType];

  const { image, map, csv, errors, maxAddr, lengthFrom10 } = useMemo(() => {
    const errs: string[] = [];
    const used: Record<number, string> = {};
    const fields = tagType !== "NTAG213" ? ALL_FIELDS : coreFields;
    const maxAddrWritten: number[] = [];

    type Write = { addr: number; bytes: number[]; field: FieldDef };
    const writes: Write[] = [];

    function writeRange(addr: number, bytes: number[], field: FieldDef) {
      for (let i = 0; i < bytes.length; i++) {
        const a = addr + i;
        if (used[a] && used[a] !== field.key) {
          errs.push(
            `${field.label} overlaps ${used[a]} at ${hex(a)} (size ${field.size})`,
          );
        }
        used[a] = field.key;
      }
      writes.push({ addr, bytes, field });
      maxAddrWritten.push(addr + bytes.length - 1);
    }

    function parseIntStrict(v: any) {
      if (v === "" || v == null) return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) return null;
      return Math.floor(n);
    }

    for (const field of fields) {
      const addr = field.addr;
      try {
        if (values[field.key] === null) {
          writeRange(addr, Array(field.size).fill([0xff]).flat(), field);
        } else {
          switch (field.kind) {
            case "str": {
              const str = String(values[field.key] ?? "");
              if (field.asciiOnly) {
                const cleaned = str.replace(/^https?:\/\//i, "");
                const bytes = encodeStringUTF8(cleaned, field.size, true);
                writeRange(addr, bytes, field);
              } else {
                const bytes = encodeStringUTF8(str, field.size);
                writeRange(addr, bytes, field);
              }
              break;
            }
            case "int": {
              const n = parseIntStrict(values[field.key]);
              if (n == null) break;
              const bytes = bePack(n, field.size);
              writeRange(addr, bytes, field);
              break;
            }
            case "intScaled": {
              const raw = Number(values[field.key]);
              if (!Number.isFinite(raw)) break;
              const scaled = Math.round(raw * (field as IntScaled).scale);
              const maxVal = Math.pow(256, field.size) - 1;
              if (scaled < 0 || scaled > maxVal) {
                errs.push(
                  `${field.label} scaled value ${scaled} does not fit in ${field.size} byte(s)`,
                );
              }
              const bytes = bePack(clamp(scaled, 0, maxVal), field.size);
              writeRange(addr, bytes, field);
              break;
            }
            case "rgb":
            case "rgba": {
              const txt = String(values[field.key] ?? "").trim();
              if (!txt) break;
              const parts = txt.split(/[,\s]+/).filter(Boolean);
              const expected = field.kind === "rgba" ? 4 : 3;
              if (parts.length !== expected) {
                errs.push(
                  `${field.label} must be ${expected} integers (e.g., 255,166,77${expected === 4 ? ",255" : ""})`,
                );
                break;
              }
              const arr = parts.map((p) => clamp(parseInt(p, 10) || 0, 0, 255));
              writeRange(addr, arr, field);
              break;
            }
            case "dateYMD": {
              const dateStr = String(values[field.key] ?? "").trim();
              if (!dateStr) break;
              const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
              if (!m) {
                errs.push(`${field.label} must be YYYY-MM-DD`);
                break;
              }
              const year = parseInt(m[1], 10);
              const month = parseInt(m[2], 10);
              const day = parseInt(m[3], 10);
              if (month < 1 || month > 12 || day < 1 || day > 31) {
                errs.push(`${field.label} has an invalid date`);
                break;
              }
              const bytes = [...bePack(year, 2), month, day];
              writeRange(addr, bytes, field);
              break;
            }
            case "timeHMS": {
              const timeStr = String(values[field.key] ?? "").trim();
              if (!timeStr) break;
              const m = /^(\d{2}):(\d{2}):(\d{2})$/.exec(timeStr);
              if (!m) {
                errs.push(`${field.label} must be HH:MM:SS`);
                break;
              }
              const hh = clamp(parseInt(m[1], 10), 0, 23);
              const mm = clamp(parseInt(m[2], 10), 0, 59);
              const ss = clamp(parseInt(m[3], 10), 0, 59);
              writeRange(addr, [hh, mm, ss], field);
              break;
            }
          }
        }
      } catch (e: any) {
        errs.push(`${field.label}: ${e.message || e}`);
      }
    }

    if (writes.length === 0) {
      return {
        image: new Uint8Array(0),
        map: [],
        csv: "",
        errors: errs,
        maxAddr: CORE_START - 1,
        lengthFrom10: 0,
      };
    }

    const highest = Math.max(...maxAddrWritten);
    const totalLen = highest - CORE_START + 1;
    if (totalLen > capacity) {
      errs.push(
        `Selected fields require ${totalLen} bytes from 0x10, which exceeds ${tagType} capacity of ${capacity}`,
      );
    }

    const mem = new Uint8Array(totalLen).fill(0x00);
    for (let a = EXT_START; a <= highest; a++) {
      const idx = a - CORE_START;
      if (idx >= 0 && idx < mem.length) mem[idx] = 0xff;
    }

    for (const w of writes) {
      const base = w.addr - CORE_START;
      for (let i = 0; i < w.bytes.length; i++) mem[base + i] = w.bytes[i];
    }

    const addrMap = writes
      .sort((a, b) => a.addr - b.addr)
      .map((w) => ({
        address: hex(w.addr, 2),
        key: w.field.key,
        label: w.field.label,
        size: w.bytes.length,
        dataHex: toHexBytes(w.bytes),
      }));

    const csv = ["address,key,label,size,dataHex"]
      .concat(
        addrMap.map((r) =>
          [
            r.address,
            JSON.stringify(r.key),
            JSON.stringify(r.label),
            r.size,
            r.dataHex,
          ].join(","),
        ),
      )
      .join("\n");

    return {
      image: mem,
      map: addrMap,
      csv,
      errors: errs,
      maxAddr: highest,
      lengthFrom10: totalLen,
    };
  }, [values, tagType]);

  function downloadBytes() {
    if (!image || image.length === 0) return;
    const blob = new Blob([image], { type: "application/octet-stream" });
    const name = `opentag3d_${tagType}_${hex(0x10)}-${hex(maxAddr)}.bin`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadJSON() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            from: hex(0x10),
            to: hex(maxAddr),
            tagType,
            entries: map,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opentag3d_${tagType}_map.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opentag3d_${tagType}_map.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hexPreview = useMemo(() => {
    if (!image.length) return [] as { addr: number; bytes: number[] }[];
    const lines: { addr: number; bytes: number[] }[] = [];
    for (let i = 0; i < image.length; i += 16)
      lines.push({
        addr: CORE_START + i,
        bytes: Array.from(image.slice(i, i + 16)),
      });
    return lines;
  }, [image]);

  const makeRows = (defs: FieldDef[]) =>
    defs.map((f) => (
      <FieldRow
        key={f.key}
        def={f}
        value={values[f.key] ?? ""}
        onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
      />
    ));

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">OpenTag3D Tag Image Builder</h1>
          <div className="flex gap-3 items-center">
            <select
              className="px-3 py-2 rounded-xl border bg-white shadow-sm"
              value={tagType}
              onChange={(e) => setTagType(e.target.value as TagType)}
            >
              <option>NTAG213</option>
              <option>NTAG215</option>
              <option>NTAG216</option>
            </select>
          </div>
        </header>

        <p className="text-sm text-slate-600 leading-relaxed">
          Fill in the fields below. The app packs them into raw NTAG memory per
          the OpenTag3D map and lets you download a contiguous{" "}
          <span className="font-mono">.bin</span> image starting at{" "}
          <span className="font-mono">0x10</span>, plus JSON and CSV maps.
          Extended bytes you don’t populate are prefilled with{" "}
          <span className="font-mono">0xFF</span>.
        </p>

        <SpecNote />

        {/* Core */}
        <section className="bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Core (fits NTAG213)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {makeRows(coreFields)}
          </div>
        </section>

        {/* Extended */}
        {tagType !== "NTAG213" && (
          <section className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-lg font-semibold mb-3">
              Extended (NTAG215/216)
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {makeRows(extFields)}
            </div>
          </section>
        )}

        {/* Actions */}
        <section className="flex flex-wrap gap-3 items-center">
          <button
            className="px-4 py-2 rounded-2xl bg-blue-600 text-white shadow hover:bg-blue-700"
            onClick={downloadBytes}
            disabled={!image.length}
          >
            Download Binary (.bin)
          </button>
          <button
            className="px-4 py-2 rounded-2xl bg-slate-900 text-white shadow hover:bg-black"
            onClick={downloadJSON}
            disabled={!image.length}
          >
            Download JSON Map
          </button>
          <button
            className="px-4 py-2 rounded-2xl bg-slate-700 text-white shadow hover:bg-slate-800"
            onClick={downloadCSV}
            disabled={!image.length}
          >
            Download CSV Map
          </button>
          <div className="text-sm text-slate-600">
            Image span: {hex(0x10)}–{hex(maxAddr)} ({lengthFrom10} bytes)
          </div>
        </section>

        {/* Issues */}
        {errors.length > 0 && (
          <section className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
            <h3 className="font-semibold mb-2 text-rose-800">Issues</h3>
            <ul className="list-disc pl-5 space-y-1 text-rose-900">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Hex Preview */}
        {image.length > 0 && (
          <section className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-lg font-semibold mb-3">
              Hex Preview (from 0x10)
            </h2>
            <div className="font-mono text-xs overflow-auto">
              {hexPreview.map((line, i) => (
                <div key={i} className="grid grid-cols-[80px,1fr] gap-3">
                  <div className="text-slate-500">{hex(line.addr, 2)}:</div>
                  <div>
                    {line.bytes
                      .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
                      .join(" ")}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="text-xs text-slate-500">
          <p>
            Core reserved region is <span className="font-mono">0x5A–0x6C</span>
            . Online Data URL is ASCII, stored without protocol at{" "}
            <span className="font-mono">0x6D</span> for 32 bytes.
          </p>
        </footer>
      </div>
    </div>
  );
}

function FieldRow({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: any;
  onChange: (v: any) => void;
}) {
  const addrText = hex(def.addr);
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
      <div className="flex items-center justify-between mb-1">
        <label className="font-medium text-sm">{def.label}</label>
        <code className="text-xs text-slate-500">
          addr: {addrText} · size: {def.size} · {def.region}
        </code>
      </div>
      <div className="flex flex-col gap-2">
        <InputForField def={def} value={value} onChange={onChange} />
        {def.note && <div className="text-xs text-slate-500">{def.note}</div>}
      </div>
    </div>
  );
}

function InputForField({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: any;
  onChange: (v: any) => void;
}) {
  switch (def.kind) {
    case "str":
      return (
        <input
          className="px-3 py-2 rounded-xl border bg-white w-full"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "int":
      return (
        <input
          type="number"
          className="px-3 py-2 rounded-xl border bg-white w-full"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "intScaled":
      return (
        <input
          type="number"
          step="any"
          className="px-3 py-2 rounded-xl border bg-white w-full"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "rgba":
      return (
        <input
          className="px-3 py-2 rounded-xl border bg-white w-full font-mono"
          placeholder={
            def.kind === "rgba" ? "R,G,B,A (0–255)" : "R,G,B (0–255)"
          }
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "dateYMD":
      return (
        <input
          type="date"
          className="px-3 py-2 rounded-xl border bg-white w-full"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "timeHMS":
      return (
        <input
          type="time"
          step={1}
          className="px-3 py-2 rounded-xl border bg-white w-full"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function SpecNote() {
  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
      <div className="font-semibold text-amber-900">Spec-aligned behaviors</div>
      <ul className="text-sm text-amber-900 list-disc pl-5 mt-1 space-y-1">
        <li>
          Reserved core region is <span className="font-mono">0x5A–0x6C</span>.
          Extended starts at <span className="font-mono">0xA0</span>. Unused
          extended bytes are prefilled with{" "}
          <span className="font-mono">0xFF</span>.
        </li>
        <li>URL is ASCII-only and stored without protocol to save space.</li>
      </ul>
    </div>
  );
}
