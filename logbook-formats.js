export const DEFAULT_FORMAT_KEY = "sacaa";

const SACAA_TIME_FIELDS = [
  "seDayDual",
  "seDayPic",
  "seDayPicus",
  "seDayCopilot",
  "seNightDual",
  "seNightPic",
  "seNightPicus",
  "seNightCopilot",
  "meDayDual",
  "meDayPic",
  "meDayPicus",
  "meDayCopilot",
  "meNightDual",
  "meNightPic",
  "meNightPicus",
  "meNightCopilot",
];

const SACAA_DECIMAL_FIELDS = [
  "instrumentActual",
  "instrumentFstd",
  "instructorSE",
  "instructorME",
  "fstdPrimary",
  "fstdSecondary",
  ...SACAA_TIME_FIELDS,
];

const FAA_DECIMAL_FIELDS = [
  "totalFlightTime",
  "categorySingleEngine",
  "categoryMultiEngine",
  "pilotTimePic",
  "pilotTimeSolo",
  "pilotTimeDualReceived",
  "pilotTimeDualGiven",
  "crossCountryTotal",
  "crossCountryOver50Nm",
  "crossCountryDualReceived",
  "crossCountrySolo",
  "crossCountryPic",
  "nightTotal",
  "nightDualReceived",
  "nightPic",
  "instrumentActual",
  "instrumentSimulated",
];

function createDefaultEntry(fields) {
  return Object.freeze(
    fields.reduce((entry, field) => {
      entry[field] = "";
      return entry;
    }, {})
  );
}

function createSummaryMetric(label, fields, options = {}) {
  return {
    label,
    fields,
    integer: Boolean(options.integer),
  };
}

function createSacaaLedgerStructure() {
  return {
    colgroupMarkup: `
      <colgroup>
        <col class="w-date" />
        <col class="w-type" />
        <col class="w-reg" />
        <col class="w-pic" />
        <col class="w-details" />
        <col class="w-nav" />
        <col class="w-small" />
        <col class="w-small" />
        <col class="w-small" />
        <col class="w-small" />
        <col class="w-small" />
        <col class="w-small" />
        <col class="w-small" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-hour" />
        <col class="w-landings" />
        <col class="w-landings" />
        <col class="w-remarks" />
      </colgroup>
    `,
    headMarkup: `
      <thead>
        <tr class="index-row">
          ${Array.from({ length: 32 }, (_, index) => `<th data-column-index="${index + 1}">(${index + 1})</th>`).join("")}
        </tr>
        <tr class="group-row">
          <th rowspan="3">Date</th>
          <th rowspan="3">Type</th>
          <th rowspan="3">Registration</th>
          <th rowspan="3">Pilot in Command</th>
          <th rowspan="3">Details of flight and remarks</th>
          <th rowspan="3">NavAids<span>Brought into use</span></th>
          <th colspan="3">Instrument</th>
          <th colspan="3">Instructor</th>
          <th colspan="1">FSTD</th>
          <th colspan="8">Single-Engine Aircraft</th>
          <th colspan="8">Multi-Engine Aircraft</th>
          <th colspan="2">Landings</th>
          <th rowspan="3">Remarks</th>
        </tr>
        <tr class="subgroup-row">
          <th rowspan="2">Place</th>
          <th rowspan="2">Actual</th>
          <th rowspan="2">FSTD</th>
          <th rowspan="2">SE</th>
          <th rowspan="2">ME</th>
          <th rowspan="2">FSTD</th>
          <th rowspan="2">FSTD</th>
          <th colspan="4">Day</th>
          <th colspan="4">Night</th>
          <th colspan="4">Day</th>
          <th colspan="4">Night</th>
          <th rowspan="2">Day</th>
          <th rowspan="2">Night</th>
        </tr>
        <tr class="micro-row">
          <th>Dual</th>
          <th>PIC</th>
          <th>PICUS</th>
          <th>Copilot</th>
          <th>Dual</th>
          <th>PIC</th>
          <th>PICUS</th>
          <th>Copilot</th>
          <th>Dual</th>
          <th>PIC</th>
          <th>PICUS</th>
          <th>Copilot</th>
          <th>Dual</th>
          <th>PIC</th>
          <th>PICUS</th>
          <th>Copilot</th>
        </tr>
      </thead>
    `,
  };
}

function createFaaLedgerStructure() {
  return {
    colgroupMarkup: `
      <colgroup>
        <col class="w-faa-date" />
        <col class="w-faa-model" />
        <col class="w-faa-aircraft" />
        <col class="w-faa-route" />
        <col class="w-faa-route" />
        <col class="w-faa-narrow" />
        <col class="w-faa-narrow" />
        <col class="w-faa-narrow" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-hour" />
        <col class="w-faa-count" />
        <col class="w-faa-count" />
        <col class="w-faa-remarks" />
      </colgroup>
    `,
    headMarkup: `
      <thead>
        <tr class="index-row">
          ${Array.from({ length: 28 }, (_, index) => `<th data-column-index="${index + 1}">(${index + 1})</th>`).join("")}
        </tr>
        <tr class="group-row">
          <th rowspan="2">Date<span>Year</span></th>
          <th rowspan="2">Make &amp;<span>Model</span></th>
          <th rowspan="2">Aircraft<span>ID</span></th>
          <th colspan="2">Route of Flight</th>
          <th colspan="3">Landings</th>
          <th rowspan="2">Total Flight Time</th>
          <th colspan="2">Category and Class</th>
          <th colspan="4">Type of Pilot Time</th>
          <th colspan="5">Cross Country</th>
          <th colspan="3">Night</th>
          <th colspan="4">Instrument</th>
          <th rowspan="2">Remarks</th>
        </tr>
        <tr class="subgroup-row">
          <th>From</th>
          <th>To</th>
          <th>Day</th>
          <th>Ngt</th>
          <th>Ngt PIC</th>
          <th>Single Engine</th>
          <th>Multi Engine</th>
          <th>PIC</th>
          <th>Solo</th>
          <th>Dual Rcv'd</th>
          <th>Dual Given</th>
          <th>Total</th>
          <th>Over 50 N.M.</th>
          <th>Dual Rcv'd</th>
          <th>XC Solo</th>
          <th>XC PIC</th>
          <th>Total</th>
          <th>Dual Rcv'd</th>
          <th>Ngt PIC</th>
          <th>Actual</th>
          <th>Simulated</th>
          <th>No. Inst. Appr.</th>
          <th>Holds</th>
        </tr>
      </thead>
    `,
  };
}

export const LOGBOOK_FORMATS = {
  sacaa: {
    key: "sacaa",
    label: "SACAA",
    title: "SACAA logbook",
    regionNote: "Current South African training logbook layout.",
    cloudMode: "legacy",
    footerLeadColumns: 7,
    printLabel: "SACAA Pilot Logbook",
    printTitle: "Flight entries ledger",
    entryFields: [
      "date",
      "type",
      "registration",
      "pilotInCommand",
      "flightDetails",
      "navaids",
      "instrumentPlace",
      "instrumentActual",
      "instrumentFstd",
      "instructorSE",
      "instructorME",
      "fstdPrimary",
      "fstdSecondary",
      ...SACAA_TIME_FIELDS,
      "landingsDay",
      "landingsNight",
      "remarks",
    ],
    ledgerFields: [
      "date",
      "type",
      "registration",
      "pilotInCommand",
      "flightDetails",
      "navaids",
      "instrumentPlace",
      "instrumentActual",
      "instrumentFstd",
      "instructorSE",
      "instructorME",
      "fstdPrimary",
      "fstdSecondary",
      ...SACAA_TIME_FIELDS,
      "landingsDay",
      "landingsNight",
      "remarks",
    ],
    timeFields: SACAA_TIME_FIELDS,
    decimalFields: SACAA_DECIMAL_FIELDS,
    integerFields: ["landingsDay", "landingsNight"],
    summableFields: [...SACAA_DECIMAL_FIELDS, "landingsDay", "landingsNight"],
    requiredFields: ["date", "type", "registration", "pilotInCommand"],
    defaultEntry: createDefaultEntry([
      "date",
      "type",
      "registration",
      "pilotInCommand",
      "flightDetails",
      "navaids",
      "instrumentPlace",
      "instrumentActual",
      "instrumentFstd",
      "instructorSE",
      "instructorME",
      "fstdPrimary",
      "fstdSecondary",
      ...SACAA_TIME_FIELDS,
      "landingsDay",
      "landingsNight",
      "remarks",
    ]),
    summaryMetrics: [
      createSummaryMetric("IF Actual", ["instrumentActual"]),
      createSummaryMetric("FSTD", ["instrumentFstd"]),
      createSummaryMetric("SE Dual", ["seDayDual", "seNightDual"]),
      createSummaryMetric("PIC Day", ["seDayPic", "meDayPic"]),
      createSummaryMetric("PIC Night", ["seNightPic", "meNightPic"]),
      createSummaryMetric("ME Dual", ["meDayDual", "meNightDual"]),
    ],
    headerSpanMap: {
      group: [[1], [2], [3], [4], [5], [6], [7, 8, 9], [10, 11, 12], [13], [14, 15, 16, 17, 18, 19, 20, 21], [22, 23, 24, 25, 26, 27, 28, 29], [30, 31], [32]],
      subgroup: [[7], [8], [9], [10], [11], [12], [13], [14, 15, 16, 17], [18, 19, 20, 21], [22, 23, 24, 25], [26, 27, 28, 29], [30], [31]],
      micro: [[14], [15], [16], [17], [18], [19], [20], [21], [22], [23], [24], [25], [26], [27], [28], [29]],
    },
    structure: createSacaaLedgerStructure(),
    formMarkup: `
      <section class="form-section format-section" data-format="sacaa">
        <div class="section-header">
          <h3>Core details</h3>
          <p>Columns 1 to 5</p>
        </div>
        <div class="form-grid form-grid--two">
          <label class="field"><span>Date</span><input type="date" name="date" required /></label>
          <label class="field"><span>Type</span><input type="text" name="type" placeholder="C152 / FNPT-II" required /></label>
          <label class="field"><span>Registration</span><input type="text" name="registration" placeholder="ZS-ABC" required /></label>
          <label class="field"><span>Pilot in command</span><input type="text" name="pilotInCommand" placeholder="SELF / instructor" required /></label>
        </div>
        <label class="field">
          <span>Details of flight and remarks</span>
          <textarea name="flightDetails" rows="3" placeholder="Sector, route, procedures, nav exercise, altitude, or training notes"></textarea>
        </label>
      </section>
      <section class="form-section format-section" data-format="sacaa">
        <div class="section-header">
          <h3>Instrument and instruction</h3>
          <p>Columns 6 to 13</p>
        </div>
        <div class="form-grid form-grid--four">
          <label class="field"><span>NavAids</span><input type="text" name="navaids" placeholder="ILS / VOR / ADF" /></label>
          <label class="field"><span>Instrument place</span><input type="text" name="instrumentPlace" placeholder="FALA / FNAB" /></label>
          <label class="field"><span>Instrument actual</span><input type="number" name="instrumentActual" min="0" step="0.1" placeholder="1.4" /></label>
          <label class="field"><span>Instrument FSTD</span><input type="number" name="instrumentFstd" min="0" step="0.1" placeholder="1.3" /></label>
        </div>
        <div class="instruction-groups">
          <article class="matrix-card instruction-card instruction-card--wide">
            <div class="matrix-title"><h4>Instructor</h4><p>Cols 10 to 12</p></div>
            <div class="form-grid form-grid--three">
              <label class="field"><span>SE</span><input type="number" name="instructorSE" min="0" step="0.1" placeholder="0.8" /></label>
              <label class="field"><span>ME</span><input type="number" name="instructorME" min="0" step="0.1" placeholder="0.4" /></label>
              <label class="field"><span>FSTD 1</span><input type="number" name="fstdPrimary" min="0" step="0.1" placeholder="1.0" /></label>
            </div>
          </article>
          <article class="matrix-card instruction-card">
            <div class="matrix-title"><h4>FSTD 2</h4><p>Col 13</p></div>
            <label class="field"><span>FSTD</span><input type="number" name="fstdSecondary" min="0" step="0.1" placeholder="1.0" /></label>
          </article>
        </div>
      </section>
      <section class="form-section format-section" data-format="sacaa">
        <div class="section-header">
          <h3>Aircraft time</h3>
          <p>Columns 14 to 31</p>
        </div>
        <div class="matrix-grid">
          <article class="matrix-card">
            <div class="matrix-title"><h4>Single-engine day</h4><p>Cols 14 to 17</p></div>
            <div class="form-grid form-grid--two">
              <label class="field"><span>Dual</span><input type="number" name="seDayDual" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>PIC</span><input type="number" name="seDayPic" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>PICUS</span><input type="number" name="seDayPicus" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>Copilot</span><input type="number" name="seDayCopilot" min="0" step="0.1" placeholder="0.0" /></label>
            </div>
          </article>
          <article class="matrix-card">
            <div class="matrix-title"><h4>Single-engine night</h4><p>Cols 18 to 21</p></div>
            <div class="form-grid form-grid--two">
              <label class="field"><span>Dual</span><input type="number" name="seNightDual" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>PIC</span><input type="number" name="seNightPic" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>PICUS</span><input type="number" name="seNightPicus" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>Copilot</span><input type="number" name="seNightCopilot" min="0" step="0.1" placeholder="0.0" /></label>
            </div>
          </article>
          <article class="matrix-card">
            <div class="matrix-title"><h4>Multi-engine day</h4><p>Cols 22 to 25</p></div>
            <div class="form-grid form-grid--two">
              <label class="field"><span>Dual</span><input type="number" name="meDayDual" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>PIC</span><input type="number" name="meDayPic" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>PICUS</span><input type="number" name="meDayPicus" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>Copilot</span><input type="number" name="meDayCopilot" min="0" step="0.1" placeholder="0.0" /></label>
            </div>
          </article>
          <article class="matrix-card">
            <div class="matrix-title"><h4>Multi-engine night</h4><p>Cols 26 to 29</p></div>
            <div class="form-grid form-grid--two">
              <label class="field"><span>Dual</span><input type="number" name="meNightDual" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>PIC</span><input type="number" name="meNightPic" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>PICUS</span><input type="number" name="meNightPicus" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>Copilot</span><input type="number" name="meNightCopilot" min="0" step="0.1" placeholder="0.0" /></label>
            </div>
          </article>
        </div>
        <div class="form-grid form-grid--three">
          <label class="field"><span>Landings day</span><input type="number" name="landingsDay" min="0" step="1" placeholder="1" /></label>
          <label class="field"><span>Landings night</span><input type="number" name="landingsNight" min="0" step="1" placeholder="0" /></label>
          <label class="field field--stretch"><span>Remarks</span><input type="text" name="remarks" placeholder="Extra notes, airports, checks, or carry-forward notes" /></label>
        </div>
      </section>
    `,
    cardTitle(entry, helpers) {
      return `${helpers.formatLedgerDate(entry.date)} • ${entry.type}`;
    },
    cardSubtitle(entry) {
      return `${entry.registration} • ${entry.pilotInCommand}`;
    },
    hoursValue(entry, helpers) {
      return helpers.formatTotal(SACAA_TIME_FIELDS.reduce((sum, field) => sum + helpers.toNumber(entry[field]), 0));
    },
    landingsMeta(entry) {
      return [
        `${entry.landingsDay || "0"} day landings`,
        `${entry.landingsNight || "0"} night landings`,
      ];
    },
    summaryTotals(entries, helpers) {
      return {
        flightHours: entries.reduce((sum, entry) => sum + helpers.toNumber(entry.seDayDual) + helpers.toNumber(entry.seDayPic) + helpers.toNumber(entry.seNightDual) + helpers.toNumber(entry.seNightPic) + helpers.toNumber(entry.meDayDual) + helpers.toNumber(entry.meNightDual) + helpers.toNumber(entry.meNightPic), 0),
        landingCount: entries.reduce((sum, entry) => sum + helpers.toNumber(entry.landingsDay) + helpers.toNumber(entry.landingsNight), 0),
      };
    },
    centeredFields: new Set(["date", "type", "registration", "navaids", "instrumentPlace", "instrumentActual", "instrumentFstd", "instructorSE", "instructorME", "fstdPrimary", "fstdSecondary", ...SACAA_TIME_FIELDS, "landingsDay", "landingsNight"]),
    wrapFields: new Set(["flightDetails", "remarks"]),
  },
  faa: {
    key: "faa",
    label: "FAA",
    title: "FAA pilot logbook",
    regionNote: "FAA-style page layout with route, category/class, pilot time, cross-country, night, and instrument columns.",
    cloudMode: "scoped",
    footerLeadColumns: 5,
    printLabel: "FAA Pilot Logbook",
    printTitle: "FAA flight entries ledger",
    entryFields: [
      "date",
      "makeModel",
      "aircraftId",
      "routeFrom",
      "routeTo",
      "landingsDay",
      "landingsNight",
      "landingsNightPic",
      "totalFlightTime",
      "categorySingleEngine",
      "categoryMultiEngine",
      "pilotTimePic",
      "pilotTimeSolo",
      "pilotTimeDualReceived",
      "pilotTimeDualGiven",
      "crossCountryTotal",
      "crossCountryOver50Nm",
      "crossCountryDualReceived",
      "crossCountrySolo",
      "crossCountryPic",
      "nightTotal",
      "nightDualReceived",
      "nightPic",
      "instrumentActual",
      "instrumentSimulated",
      "instrumentApproaches",
      "instrumentHolds",
      "remarks",
    ],
    ledgerFields: [
      "date",
      "makeModel",
      "aircraftId",
      "routeFrom",
      "routeTo",
      "landingsDay",
      "landingsNight",
      "landingsNightPic",
      "totalFlightTime",
      "categorySingleEngine",
      "categoryMultiEngine",
      "pilotTimePic",
      "pilotTimeSolo",
      "pilotTimeDualReceived",
      "pilotTimeDualGiven",
      "crossCountryTotal",
      "crossCountryOver50Nm",
      "crossCountryDualReceived",
      "crossCountrySolo",
      "crossCountryPic",
      "nightTotal",
      "nightDualReceived",
      "nightPic",
      "instrumentActual",
      "instrumentSimulated",
      "instrumentApproaches",
      "instrumentHolds",
      "remarks",
    ],
    decimalFields: FAA_DECIMAL_FIELDS,
    integerFields: ["landingsDay", "landingsNight", "landingsNightPic", "instrumentApproaches", "instrumentHolds"],
    summableFields: [...FAA_DECIMAL_FIELDS, "landingsDay", "landingsNight", "landingsNightPic", "instrumentApproaches", "instrumentHolds"],
    requiredFields: ["date", "makeModel", "aircraftId", "routeFrom", "routeTo"],
    defaultEntry: createDefaultEntry([
      "date",
      "makeModel",
      "aircraftId",
      "routeFrom",
      "routeTo",
      "landingsDay",
      "landingsNight",
      "landingsNightPic",
      "totalFlightTime",
      "categorySingleEngine",
      "categoryMultiEngine",
      "pilotTimePic",
      "pilotTimeSolo",
      "pilotTimeDualReceived",
      "pilotTimeDualGiven",
      "crossCountryTotal",
      "crossCountryOver50Nm",
      "crossCountryDualReceived",
      "crossCountrySolo",
      "crossCountryPic",
      "nightTotal",
      "nightDualReceived",
      "nightPic",
      "instrumentActual",
      "instrumentSimulated",
      "instrumentApproaches",
      "instrumentHolds",
      "remarks",
    ]),
    summaryMetrics: [
      createSummaryMetric("PIC", ["pilotTimePic"]),
      createSummaryMetric("Solo", ["pilotTimeSolo"]),
      createSummaryMetric("Dual Rcv'd", ["pilotTimeDualReceived"]),
      createSummaryMetric("Dual Given", ["pilotTimeDualGiven"]),
      createSummaryMetric("XC Total", ["crossCountryTotal"]),
      createSummaryMetric("Night Total", ["nightTotal"]),
    ],
    headerSpanMap: {
      group: [[1], [2], [3], [4, 5], [6, 7, 8], [9], [10, 11], [12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23], [24, 25, 26, 27], [28]],
      subgroup: [[4], [5], [6], [7], [8], [10], [11], [12], [13], [14], [15], [16], [17], [18], [19], [20], [21], [22], [23], [24], [25], [26], [27]],
      micro: [],
    },
    structure: createFaaLedgerStructure(),
    formMarkup: `
      <section class="form-section format-section" data-format="faa">
        <div class="section-header">
          <h3>Core details</h3>
          <p>Columns 1 to 5 and 28</p>
        </div>
        <div class="form-grid faa-grid--identity">
          <label class="field"><span>Date</span><input type="date" name="date" required /></label>
          <label class="field"><span>Make &amp; model</span><input type="text" name="makeModel" placeholder="C172 / PA28-140" required /></label>
          <label class="field"><span>Aircraft ID</span><input type="text" name="aircraftId" placeholder="N123AB" required /></label>
        </div>
        <div class="form-grid form-grid--two faa-grid--route">
          <label class="field"><span>From</span><input type="text" name="routeFrom" placeholder="FALA" required /></label>
          <label class="field"><span>To</span><input type="text" name="routeTo" placeholder="FAGC" required /></label>
        </div>
        <label class="field">
          <span>Remarks</span>
          <textarea name="remarks" rows="3" placeholder="Check rides, route notes, endorsements, approaches, or training remarks"></textarea>
        </label>
      </section>
      <section class="form-section format-section" data-format="faa">
        <div class="section-header">
          <h3>Landings and pilot time</h3>
          <p>Columns 6 to 15</p>
        </div>
        <div class="instruction-groups instruction-groups--equal">
          <article class="matrix-card instruction-card">
            <div class="matrix-title"><h4>Landings and totals</h4><p>Cols 6 to 9</p></div>
            <div class="form-grid form-grid--two">
              <label class="field"><span>Landings day</span><input type="number" name="landingsDay" min="0" step="1" placeholder="1" /></label>
              <label class="field"><span>Landings night</span><input type="number" name="landingsNight" min="0" step="1" placeholder="0" /></label>
              <label class="field"><span>Night PIC landings</span><input type="number" name="landingsNightPic" min="0" step="1" placeholder="0" /></label>
              <label class="field"><span>Total flight time</span><input type="number" name="totalFlightTime" min="0" step="0.1" placeholder="1.4" /></label>
            </div>
          </article>
          <article class="matrix-card instruction-card">
            <div class="matrix-title"><h4>Category and pilot time</h4><p>Cols 10 to 15</p></div>
            <div class="form-grid form-grid--two">
              <label class="field"><span>Single engine</span><input type="number" name="categorySingleEngine" min="0" step="0.1" placeholder="1.4" /></label>
              <label class="field"><span>Multi engine</span><input type="number" name="categoryMultiEngine" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>PIC</span><input type="number" name="pilotTimePic" min="0" step="0.1" placeholder="1.2" /></label>
              <label class="field"><span>Solo</span><input type="number" name="pilotTimeSolo" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>Dual received</span><input type="number" name="pilotTimeDualReceived" min="0" step="0.1" placeholder="1.0" /></label>
              <label class="field"><span>Dual given</span><input type="number" name="pilotTimeDualGiven" min="0" step="0.1" placeholder="0.0" /></label>
            </div>
          </article>
        </div>
      </section>
      <section class="form-section format-section" data-format="faa">
        <div class="section-header">
          <h3>Cross-country, night, and instrument</h3>
          <p>Columns 16 to 27</p>
        </div>
        <div class="matrix-grid matrix-grid--faa">
          <article class="matrix-card">
            <div class="matrix-title"><h4>Cross country</h4><p>Cols 16 to 20</p></div>
            <div class="form-grid form-grid--two">
              <label class="field"><span>Total</span><input type="number" name="crossCountryTotal" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>Over 50 N.M.</span><input type="number" name="crossCountryOver50Nm" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>Dual received</span><input type="number" name="crossCountryDualReceived" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>XC solo</span><input type="number" name="crossCountrySolo" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field field--stretch"><span>XC PIC</span><input type="number" name="crossCountryPic" min="0" step="0.1" placeholder="0.0" /></label>
            </div>
          </article>
          <article class="matrix-card">
            <div class="matrix-title"><h4>Night</h4><p>Cols 21 to 23</p></div>
            <div class="form-grid form-grid--two">
              <label class="field"><span>Total</span><input type="number" name="nightTotal" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>Dual received</span><input type="number" name="nightDualReceived" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field field--stretch"><span>Night PIC</span><input type="number" name="nightPic" min="0" step="0.1" placeholder="0.0" /></label>
            </div>
          </article>
          <article class="matrix-card">
            <div class="matrix-title"><h4>Instrument</h4><p>Cols 24 to 27</p></div>
            <div class="form-grid form-grid--two">
              <label class="field"><span>Actual</span><input type="number" name="instrumentActual" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>Simulated</span><input type="number" name="instrumentSimulated" min="0" step="0.1" placeholder="0.0" /></label>
              <label class="field"><span>Approaches</span><input type="number" name="instrumentApproaches" min="0" step="1" placeholder="0" /></label>
              <label class="field"><span>Holds</span><input type="number" name="instrumentHolds" min="0" step="1" placeholder="0" /></label>
            </div>
          </article>
        </div>
      </section>
    `,
    cardTitle(entry, helpers) {
      return `${helpers.formatLedgerDate(entry.date)} • ${entry.makeModel}`;
    },
    cardSubtitle(entry) {
      return `${entry.aircraftId} • ${entry.routeFrom} to ${entry.routeTo}`;
    },
    hoursValue(entry, helpers) {
      return helpers.formatTotal(helpers.toNumber(entry.totalFlightTime));
    },
    landingsMeta(entry) {
      return [
        `${entry.landingsDay || "0"} day landings`,
        `${entry.landingsNight || "0"} night landings`,
      ];
    },
    summaryTotals(entries, helpers) {
      return {
        flightHours: entries.reduce((sum, entry) => sum + helpers.toNumber(entry.totalFlightTime), 0),
        landingCount: entries.reduce((sum, entry) => sum + helpers.toNumber(entry.landingsDay) + helpers.toNumber(entry.landingsNight) + helpers.toNumber(entry.landingsNightPic), 0),
      };
    },
    centeredFields: new Set([
      "date",
      "makeModel",
      "aircraftId",
      "routeFrom",
      "routeTo",
      "landingsDay",
      "landingsNight",
      "landingsNightPic",
      "totalFlightTime",
      "categorySingleEngine",
      "categoryMultiEngine",
      "pilotTimePic",
      "pilotTimeSolo",
      "pilotTimeDualReceived",
      "pilotTimeDualGiven",
      "crossCountryTotal",
      "crossCountryOver50Nm",
      "crossCountryDualReceived",
      "crossCountrySolo",
      "crossCountryPic",
      "nightTotal",
      "nightDualReceived",
      "nightPic",
      "instrumentActual",
      "instrumentSimulated",
      "instrumentApproaches",
      "instrumentHolds",
    ]),
    wrapFields: new Set(["remarks"]),
  },
};

export function getFormatConfig(formatKey) {
  return LOGBOOK_FORMATS[formatKey] || LOGBOOK_FORMATS[DEFAULT_FORMAT_KEY];
}

export function getFormatOptions() {
  return Object.values(LOGBOOK_FORMATS).map(({ key, label, title }) => ({ key, label, title }));
}
