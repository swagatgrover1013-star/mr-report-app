// One-time generator: reads scripts/data/All_Doctors_2026.csv and produces
// src/data/seed.ts with real Doctor/Chemist/Stockist/Product/User entities.
// Run with: node scripts/generate-real-data.js

const fs = require("fs");
const path = require("path");

const CSV_PATH = path.join(__dirname, "data", "All_Doctors_2026.csv");
const OUT_PATH = path.join(__dirname, "..", "src", "data", "seed.ts");

// ---------- CSV parsing (handles quoted fields containing commas) ----------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const raw = fs.readFileSync(CSV_PATH, "utf-8");
const rows = parseCsv(raw);
const header = rows[0];
const dataRows = rows.slice(1).filter((r) => r.length >= 9 && r[3] && r[3].trim());

// ---------- text helpers ----------
function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
}

// Pharma/address acronyms that should stay fully uppercase rather than be title-cased
const PRODUCT_ACRONYMS = new Set(["XT", "SB", "CV", "FX", "EC", "SP", "DSR", "FW"]);
const PLACE_ACRONYMS = new Set(["GMCH", "PGI", "ESI", "NAC", "MDC", "HMT"]);

function titleCaseSmart(s, whitelist) {
  return s
    .split(" ")
    .map((tok) => {
      const bare = tok.replace(/[^A-Za-z]/g, "");
      if (bare && whitelist.has(bare.toUpperCase())) return tok.toUpperCase();
      if (!tok) return tok;
      return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
    })
    .join(" ");
}

function collapseSpace(s) {
  return s.replace(/\s+/g, " ").trim();
}

// known OCR/typing typo corrections in the source sheet (verified by inspection)
const PRODUCT_FIXES = {
  "RESOVGLO H": "RESVOGLO H",
  "RESVOGO H": "RESVOGLO H",
  "CASMA D3 SHOTS": "CALSMA D3 SHOTS",
  "CASLMA SUSP": "CALSMA SUSP",
  "CASLMA": "CALSMA",
  "CASLMA D3 SHOT": "CALSMA D3 SHOT",
  "CASMA": "CALSMA",
  "GUSTAR": "GUTSTAR",
  "MONTRBRE FX": "MONTBRE FX",
  "JUST MEE": "JUST ME",
  "UVEDGE30 GEL": "UVEDGE 30 GEL",
  "UVEDGE SPF50 GEL": "UVEDGE SPF 50 GEL",
  "CALSMA D3 SHOT": "CALSMA D3 SHOTS",
  "SKINJOY SHOT": "SKINJOY SHOTS",
};

const GENERIC_PRODUCT_PHRASES = new Set(["ALL TOPICAL PRODUCTS", "DERMA TOPICAL ALL"]);
const GENERIC_RETAILER_PHRASES = new Set(["OWN PHARMACY", "OWN"]);
const RETAILER_FIXES = { "WADHWA MEDICOSE": "WADHWA MEDICOS" };

function normalizeProductName(name) {
  let n = collapseSpace(name.toUpperCase()).replace(/\.$/, "");
  if (PRODUCT_FIXES[n]) n = PRODUCT_FIXES[n];
  return n;
}

// "CALSMA D3 TAB/SHOTS" -> ["CALSMA D3 TAB", "CALSMA D3 SHOTS"]; "RENSA FW/BAR" -> ["RENSA FW", "RENSA BAR"]
function expandSlashVariants(name) {
  if (!name.includes("/")) return [name];
  const words = name.split(" ");
  const last = words[words.length - 1];
  if (!last.includes("/")) return [name];
  const prefix = words.slice(0, -1).join(" ");
  return last.split("/").map((suffix) => collapseSpace(`${prefix} ${suffix}`));
}

// a handful of source cells run two products together without a comma separator
const MULTI_PRODUCT_SPLIT = {
  "CALSMA D3 TAB. MONTBRE L": ["CALSMA D3 TAB", "MONTBRE L"],
};

function splitList(value, { isProduct } = {}) {
  if (!value) return [];
  const items = value
    .split(",")
    .map((s) => collapseSpace(s))
    .filter(Boolean)
    .map((s) => (isProduct ? normalizeProductName(s) : RETAILER_FIXES[collapseSpace(s.toUpperCase())] || collapseSpace(s.toUpperCase())))
    .filter((s) => (isProduct ? !GENERIC_PRODUCT_PHRASES.has(s) : !GENERIC_RETAILER_PHRASES.has(s)));
  if (!isProduct) return items;
  return items.flatMap((s) => MULTI_PRODUCT_SPLIT[s] || expandSlashVariants(s));
}

const SPECIALTY_MAP = {
  DERMA: "Dermatology",
  "G.P": "General Physician",
  "G. P.": "General Physician",
  "G.P.": "General Physician",
  GP: "General Physician",
  "G P": "General Physician",
  "G.P.ENDO": "Endocrinology",
  PSY: "Psychiatry",
  OPTH: "Ophthalmology",
  DENT: "Dentistry",
  ORTHO: "Orthopedics",
  PED: "Pediatrics",
  PEDIA: "Pediatrics",
  GYN: "Gynaecology",
  GYNAECOLOGY: "Gynaecology",
  ENT: "ENT",
  HEPATOLOGY: "Hepatology",
  NURO: "Neurology",
};

function normalizeSpecialty(raw) {
  const key = collapseSpace(raw.toUpperCase());
  return SPECIALTY_MAP[key] || titleCase(raw);
}

// ---------- pass 1: collect ----------
const repsByName = new Map(); // name -> { name, hq }
const doctors = [];
const productStats = new Map(); // normalizedName -> { promotionCount, rxCount, rxSpecialties: Map<spec,count>, promoSpecialties: Map }
const chemistStats = new Map(); // normalizedName -> { count, cities: Map<city,count>, areas: Map<area,count> }

for (const r of dataRows) {
  const [srNo, repName, hq, doctorNameRaw, specialtyRaw, addressRaw, retailersRaw, promoRaw, rxRaw] = r;
  const repNameClean = collapseSpace(repName).toUpperCase();
  const hqClean = collapseSpace(hq);
  if (!repsByName.has(repNameClean)) repsByName.set(repNameClean, { name: titleCase(repName), hq: titleCase(hqClean) });

  // doctor name: defensively cut at any stray tab (source data corruption guard),
  // and strip a redundant leading "Dr"/"Dr." since we add our own "Dr." prefix
  const doctorName = titleCase(
    collapseSpace(doctorNameRaw.split("\t")[0]).replace(/^dr\.?\s+/i, "")
  );
  const specialty = normalizeSpecialty(collapseSpace(specialtyRaw));
  const address = titleCaseSmart(collapseSpace(addressRaw || ""), PLACE_ACRONYMS);
  const city = titleCase(hqClean);

  const retailers = splitList(retailersRaw);
  const promoted = splitList(promoRaw, { isProduct: true });
  const prescribed = splitList(rxRaw, { isProduct: true });

  doctors.push({
    srNo: Number(srNo),
    repName: titleCase(repName),
    city,
    name: doctorName,
    specialty,
    address,
    retailers,
    promoted,
    prescribed,
  });

  for (const p of promoted) {
    const s = productStats.get(p) || { promotionCount: 0, rxCount: 0, specialties: new Map() };
    s.promotionCount++;
    s.specialties.set(specialty, (s.specialties.get(specialty) || 0) + 1);
    productStats.set(p, s);
  }
  for (const p of prescribed) {
    const s = productStats.get(p) || { promotionCount: 0, rxCount: 0, specialties: new Map() };
    s.rxCount++;
    s.specialties.set(specialty, (s.specialties.get(specialty) || 0) + 2); // weight Rx higher for category inference
    productStats.set(p, s);
  }

  for (const ret of retailers) {
    const s = chemistStats.get(ret) || { count: 0, cities: new Map(), areas: new Map() };
    s.count++;
    s.cities.set(city, (s.cities.get(city) || 0) + 1);
    s.areas.set(address, (s.areas.get(address) || 0) + 1);
    chemistStats.set(ret, s);
  }
}

function topKey(map) {
  let best = null, bestCount = -1;
  for (const [k, v] of map) if (v > bestCount) { best = k; bestCount = v; }
  return best;
}

// ---------- build Users ----------
const repList = Array.from(repsByName.values());
const avatarColors = ["var(--indigo)", "var(--brass)", "#7C9885", "#B5495B"];
const users = repList.map((rep, i) => ({
  id: `u${i + 1}`,
  name: rep.name,
  email: `${rep.name.toLowerCase().replace(/[^a-z]+/g, ".")}@aurelderma.com`,
  employeeId: `MR-${1001 + i}`,
  role: "mr",
  territory: rep.hq,
  phone: "",
  avatarColor: avatarColors[i % avatarColors.length],
  status: "active",
  joinedAt: "2023-01-01",
}));

// ---------- build Products ----------
const productNames = Array.from(productStats.keys()).sort();
const products = productNames.map((name, i) => {
  const stats = productStats.get(name);
  const category = topKey(stats.specialties) || "General";
  let dosageForm = "—";
  const suffixMap = [
    [/SHOTS?$/, "Shots"], [/GEL$/, "Gel"], [/TAB(LET)?S?$/, "Tablet"], [/CAPS?$/, "Capsule"],
    [/SYRUP$/, "Syrup"], [/DROPS?$/, "Drops"], [/BAR$/, "Bar"], [/SHAMPOO$/, "Shampoo"],
    [/SERUM$/, "Serum"], [/LOTION$/, "Lotion"], [/CREAM$/, "Cream"], [/SUSP\.?$/, "Suspension"],
    [/FW$/, "Face Wash"],
  ];
  for (const [re, label] of suffixMap) if (re.test(name)) { dosageForm = label; break; }
  return {
    id: `p${i + 1}`,
    name: titleCaseSmart(name, PRODUCT_ACRONYMS),
    category,
    brand: "Meridian Pharma",
    strength: "—",
    dosageForm,
    description: "",
    totalMentions: stats.promotionCount + stats.rxCount,
    doctorsRecommending: stats.rxCount,
  };
});
const productIdByName = new Map(products.map((p) => [p.name.toUpperCase(), p.id]));

// ---------- build Chemists + Stockists ----------
const cities = Array.from(new Set(repList.map((r) => titleCase(r.hq))));
const stockists = cities.map((city, i) => ({
  id: `s${i + 1}`,
  name: `${city} Pharma Distributors`,
  ownerName: "",
  city,
  area: city,
  address: city,
  phone: "",
  email: "",
  gstNumber: "",
  monthlyOrderValue: 0,
  lastVisitDate: null,
  totalVisits: 0,
  tier: "gold",
}));
const stockistIdByCity = new Map(stockists.map((s) => [s.city, s.id]));

const chemistNames = Array.from(chemistStats.keys()).sort();
const counts = chemistNames.map((n) => chemistStats.get(n).count).sort((a, b) => a - b);
const p33 = counts[Math.floor(counts.length * 0.33)] ?? 1;
const p66 = counts[Math.floor(counts.length * 0.66)] ?? 1;

const chemists = chemistNames.map((name, i) => {
  const stats = chemistStats.get(name);
  const city = topKey(stats.cities);
  const area = topKey(stats.areas);
  const tier = stats.count > p66 ? "platinum" : stats.count > p33 ? "gold" : "silver";
  return {
    id: `c${i + 1}`,
    name: titleCase(name),
    ownerName: "",
    city,
    area,
    address: area,
    phone: "",
    email: "",
    gstNumber: "",
    stockistId: stockistIdByCity.get(city) ?? null,
    lastVisitDate: null,
    totalVisits: 0,
    tier,
  };
});

// ---------- build Doctors ----------
const doctorEntities = doctors.map((d) => {
  const tier = d.prescribed.length >= 3 ? "platinum" : d.prescribed.length >= 1 ? "gold" : "silver";
  const notesParts = [];
  if (d.promoted.length) notesParts.push(`Promoted: ${d.promoted.map((n) => titleCaseSmart(n, PRODUCT_ACRONYMS)).join(", ")}.`);
  return {
    id: `d${d.srNo}`,
    name: `Dr. ${d.name}`,
    specialization: d.specialty,
    hospital: d.address || "",
    city: d.city,
    area: d.address || "",
    address: d.address || "",
    phone: "",
    email: "",
    qualification: "",
    visitFrequency: "Monthly",
    notes: notesParts.join(" "),
    lastVisitDate: null,
    totalVisits: 0,
    tier,
    _repName: d.repName,
    _promoted: d.promoted,
    _prescribed: d.prescribed,
  };
});

// ---------- emit TypeScript ----------
function ts(value) {
  return JSON.stringify(value, null, 2);
}

function stripPrivate(doc) {
  const { _repName, _promoted, _prescribed, ...rest } = doc;
  return rest;
}

const lines = [];
lines.push("// AUTO-GENERATED by scripts/generate-real-data.js from scripts/data/All_Doctors_2026.csv");
lines.push("// Do not hand-edit — re-run the generator if the source CSV changes.");
lines.push('import type { Doctor, Chemist, Stockist, Product, User } from "@/types";');
lines.push("");
lines.push(`export const realUsers: User[] = ${ts(users)};`);
lines.push("");
lines.push(`export const realProducts: Product[] = ${ts(products)};`);
lines.push("");
lines.push(`export const realStockists: Stockist[] = ${ts(stockists)};`);
lines.push("");
lines.push(`export const realChemists: Chemist[] = ${ts(chemists)};`);
lines.push("");
lines.push(`export const realDoctors: Doctor[] = ${ts(doctorEntities.map(stripPrivate))};`);
lines.push("");
// per-doctor product associations (for realistic visit generation), keyed by doctor id
const doctorAssociations = {};
doctorEntities.forEach((d) => {
  const promotedIds = d._promoted.map((n) => productIdByName.get(n)).filter(Boolean);
  const prescribedIds = d._prescribed.map((n) => productIdByName.get(n)).filter(Boolean);
  doctorAssociations[d.id] = { promotedIds, prescribedIds, repName: d._repName };
});
lines.push(`export const doctorProductAssociations: Record<string, { promotedIds: string[]; prescribedIds: string[]; repName: string }> = ${ts(doctorAssociations)};`);
lines.push("");

fs.writeFileSync(OUT_PATH, lines.join("\n"));

console.log(`Reps: ${users.length}`);
console.log(`Doctors: ${doctorEntities.length}`);
console.log(`Products: ${products.length}`);
console.log(`Chemists: ${chemists.length}`);
console.log(`Stockists: ${stockists.length}`);
console.log(`Wrote ${OUT_PATH}`);
