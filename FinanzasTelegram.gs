/***************
 * CONFIG
 ***************/
const TELEGRAM_TOKEN = "AQUI TU TOKEN";
const TELEGRAM_CHAT_ID = "TU ID";

// Nombres a mostrar (solo texto, no afecta a la lógica)
const PERSON_1_NAME = "Señor_X";
const PERSON_2_NAME = "Señora_X";

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

// Resumen principal (sin “Saldo inicial”)
const LABELS = [
  "Ingreso","Gastos","Facturas","Deudas",
  "Ahorros","Suscripciones","Inversiones","IZQUIERDA"
];

const OUT_KEYS = ["Gastos","Facturas","Deudas","Ahorros","Suscripciones","Inversiones"];

/***************
 * MAIN (trigger mensual: 5 días antes)
 ***************/
function monthlyTelegramSummaryIfNeeded() {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const today = now.getDate();
  const targetDay = lastDay - 5;

  if (today !== targetDay) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = resolveSheetNameForMonth(ss, monthIndex);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sendTelegram(`⚠️ No encuentro la hoja del mes: "${sheetName}". Revisa el nombre.`);
    return;
  }

  const data = readCashflowSummary(sheet);
  const alerts = readAlertsFixedRanges(sheet);

  sendTelegram(buildMessage(sheet.getName(), data, alerts));
}

/***************
 * TEST: Ejecutar manualmente para pruebas
 ***************/
function testSendNow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Febrero") || ss.getSheets()[0];

  const data = readCashflowSummary(sheet);
  const alerts = readAlertsFixedRanges(sheet);

  sendTelegram(buildMessage(sheet.getName(), data, alerts));
}

/***************
 * READ CASHFLOW (tabla resumen de flujo de caja)
 * Categoría en B/C (merge)
 * Person1 → columna E
 * Person2 → columna G
 ***************/
function readCashflowSummary(sheet) {
  const out = {};
  LABELS.forEach(label => {
    const row = findRowByLabelExactInBC(sheet, label);
    out[label] = row
      ? {
          p1: toNumber(sheet.getRange(row, 5).getValue()), // E
          p2: toNumber(sheet.getRange(row, 7).getValue())  // G
        }
      : { p1: 0, p2: 0 };
  });
  return out;
}

function findRowByLabelExactInBC(sheet, label) {
  const pattern = `^\\s*${escapeRegex(label)}\\s*$`;
  const finder = sheet.getRange("B:C")
    .createTextFinder(pattern)
    .useRegularExpression(true)
    .matchCase(false);

  const cell = finder.findNext();
  return cell ? cell.getRow() : null;
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/***************
 * ALERTS (rangos FIJOS, como indicaste)
 *
 * SEGUROS:
 * - Categorías: R34:S36
 * - Valores:     V34:X36   (3 columnas)
 *
 * TRIBUTOS (paga PERSON_1):
 * - Categorías: I54:K56
 * - Valores:     M54:M56
 ***************/
function readAlertsFixedRanges(sheet) {
  // --- SEGUROS ---
  const segurosCatGrid = sheet.getRange("R34:S36").getDisplayValues();
  const segurosCats = segurosCatGrid.map(row => pickCategoryText(row));

  const segurosValsGrid = sheet.getRange("V34:X36").getDisplayValues();

  const segurosP1 = [];
  const segurosP2 = [];

  segurosCats.forEach((cat, i) => {
    if (!cat) return;

    const rowVals = segurosValsGrid[i]; // [V,W,X]
    const nums = extractNumbersFromCells(rowVals); // ej [129.44, 0] o [0, 79.75]

    const p1 = nums[0] || 0;
    const p2 = nums[1] || 0;

    if (p1 > 0) segurosP1.push({ name: cat, amount: p1 });
    if (p2 > 0) segurosP2.push({ name: cat, amount: p2 });
  });

  // --- TRIBUTOS ---
  const tribCatGrid = sheet.getRange("I54:K56").getDisplayValues();
  const tribCats = tribCatGrid.map(row => pickCategoryText(row));

  const tribVals = sheet.getRange("M54:M56").getDisplayValues().flat();
  const tributosP1 = [];

  tribCats.forEach((cat, i) => {
    if (!cat) return;

    const val = toNumber(tribVals[i]);
    if (val > 0) tributosP1.push({ name: cat, amount: val });
  });

  return { tributosP1, segurosP1, segurosP2 };
}

/**
 * Devuelve la primera celda “usable” como texto dentro de una fila de categorías.
 * Filtra: "", "FALSE", "TRUE"
 */
function pickCategoryText(row) {
  for (let i = 0; i < row.length; i++) {
    const v = String(row[i] || "").trim();
    if (!v) continue;
    const up = v.toUpperCase();
    if (up === "FALSE" || up === "TRUE") continue;
    return v;
  }
  return "";
}

function extractNumbersFromCells(cells) {
  // Dado un array de strings (ej ["€", "129,44", "0"])
  // devuelve solo números en orden de aparición.
  const nums = [];
  cells.forEach(c => {
    const s = String(c || "");
    const matches = s.match(/-?\d{1,3}(?:\.\d{3})*(?:,\d+)?|-?\d+(?:,\d+)?/g);
    if (matches) matches.forEach(m => nums.push(toNumber(m)));
  });
  return nums.filter(n => typeof n === "number" && !isNaN(n));
}

/***************
 * MESSAGE (visual)
 ***************/
function buildMessage(month, d, alerts) {
  const lines = [];
  lines.push(`📊 Resumen — ${month}`);
  lines.push("");

  // ===== PERSON 1 =====
  const ingreso1 = d["Ingreso"].p1;
  const salidas1 = OUT_KEYS.reduce((a,k)=> a + d[k].p1, 0);
  const neto1 = ingreso1 - salidas1;

  lines.push(`👤 *${PERSON_1_NAME}*`);
  LABELS.forEach(k => lines.push(`• ${k}: ${eur(d[k].p1)}`));
  lines.push(`➡️ Neto: *${eur(neto1)}*`);
  lines.push("");

  // ===== PERSON 2 =====
  const ingreso2 = d["Ingreso"].p2;
  const salidas2 = OUT_KEYS.reduce((a,k)=> a + d[k].p2, 0);
  const neto2 = ingreso2 - salidas2;

  lines.push(`👤 *${PERSON_2_NAME}*`);
  LABELS.forEach(k => lines.push(`• ${k}: ${eur(d[k].p2)}`));
  lines.push(`➡️ Neto: *${eur(neto2)}*`);
  lines.push("");

  // ===== TOTAL =====
  const ingresoT = ingreso1 + ingreso2;
  const salidasT = salidas1 + salidas2;
  const netoT = neto1 + neto2;
  const disponibleT = d["IZQUIERDA"].p1 + d["IZQUIERDA"].p2;

  lines.push(`🧾 *Total (${PERSON_1_NAME} + ${PERSON_2_NAME})*`);
  lines.push(`💰 Ingresos: ${eur(ingresoT)}`);
  lines.push(`🔻 Salidas: ${eur(salidasT)}`);
  lines.push(`➡️ Neto: *${eur(netoT)}*`);
  lines.push(`✅ Disponible total: *${eur(disponibleT)}*`);

  // ===== ALERTAS =====
  const trib = alerts.tributosP1 || [];
  const seg1 = alerts.segurosP1 || [];
  const seg2 = alerts.segurosP2 || [];

  if (trib.length || seg1.length || seg2.length) {
    lines.push("");
    lines.push("⚠️ *Avisos importantes*");

    if (trib.length) lines.push(`• Tributos (${PERSON_1_NAME}): ${formatItemsWithAmount(trib)}`);
    if (seg1.length) lines.push(`• Seguros (${PERSON_1_NAME}): ${formatItemsWithAmount(seg1)}`);
    if (seg2.length) lines.push(`• Seguros (${PERSON_2_NAME}): ${formatItemsWithAmount(seg2)}`);
  }

  return lines.join("\n");
}

function formatItemsWithAmount(items) {
  return items.map(x => `*${x.name}* (${eur(x.amount)})`).join(", ");
}

/***************
 * HELPERS
 ***************/
function eur(n) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);
}

function toNumber(v) {
  if (typeof v === "number") return v;
  const s = String(v || "");
  const cleaned = s.replace(/[€\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function resolveSheetNameForMonth(ss, monthIndex) {
  const name = MONTH_NAMES[monthIndex];
  if (name === "Agosto") {
    if (ss.getSheetByName("Agosto")) return "Agosto";
    if (ss.getSheetByName("Agoto")) return "Agoto";
  }
  return name;
}

/***************
 * TELEGRAM
 ***************/
function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = { chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" };

  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}
