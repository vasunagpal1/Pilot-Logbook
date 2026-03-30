const STORAGE_KEY = "pilot-logbook-atelier-v1";
const SUM_SELECTION_KEY = "pilot-logbook-atelier-sum-selection-v1";
const DISPLAY_PREFERENCES_KEY = "pilot-logbook-display-preferences-v1";
const SPLIT_FIELD_PREFIX = "split__";
const PRINT_PAGE_ENTRY_LIMIT = 18;
const PRINT_PAGE_MIN_BLANK_ROWS = 6;
const REQUIRED_FIELDS = ["date", "type", "registration", "pilotInCommand"];
const ALL_LEDGER_COLUMN_INDICES = Array.from({ length: 32 }, (_, index) => index + 1);
const HEADER_SPAN_MAP = {
  group: [[1], [2], [3], [4], [5], [6], [7, 8, 9], [10, 11], [12, 13], [14, 15, 16, 17, 18, 19, 20, 21], [22, 23, 24, 25, 26, 27, 28, 29], [30, 31], [32]],
  subgroup: [[7], [8], [9], [10], [11], [12], [13], [14, 15, 16, 17], [18, 19, 20, 21], [22, 23, 24, 25], [26, 27, 28, 29], [30], [31]],
  micro: [[14], [15], [16], [17], [18], [19], [20], [21], [22], [23], [24], [25], [26], [27], [28], [29]],
};

const TIME_FIELDS = [
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

const DECIMAL_FIELDS = [
  "instrumentActual",
  "instrumentFstd",
  "instructorSE",
  "instructorME",
  "fstdPrimary",
  "fstdSecondary",
  ...TIME_FIELDS,
];

const INTEGER_FIELDS = ["landingsDay", "landingsNight"];
const SUMMABLE_FIELDS = [
  "instrumentActual",
  "instrumentFstd",
  "instructorSE",
  "instructorME",
  "fstdPrimary",
  "fstdSecondary",
  ...TIME_FIELDS,
  ...INTEGER_FIELDS,
];

const ENTRY_FIELDS = [
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
  ...TIME_FIELDS,
  "landingsDay",
  "landingsNight",
  "remarks",
];

const LEDGER_FIELDS = [
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
  ...TIME_FIELDS,
  "landingsDay",
  "landingsNight",
  "remarks",
];

const DEFAULT_ENTRY = Object.freeze(
  ENTRY_FIELDS.reduce((entry, field) => {
    entry[field] = "";
    return entry;
  }, {})
);

const initialEntries = loadEntries();

const state = {
  entries: initialEntries,
  selectedSumIds: new Set(loadSelectedSumIds(initialEntries)),
  selectedDeleteIds: new Set(),
  editingId: null,
  splitSourceId: null,
  ledgerInteractionMode: "edit",
  hideZeroValues: loadDisplayPreferences().hideZeroValues,
  hideEmptyColumns: loadDisplayPreferences().hideEmptyColumns,
  dragId: null,
  dragPosition: null,
};

const form = document.querySelector("#entry-form");
const entryStage = document.querySelector(".entry-stage");
const entryFormScroll = document.querySelector("#entry-form-scroll");
const saveButton = document.querySelector("#save-button");
const splitEntryButton = document.querySelector("#split-entry");
const cancelSplitButton = document.querySelector("#cancel-split");
const deleteEntryButton = document.querySelector("#delete-entry");
const resetFormButton = document.querySelector("#reset-form");
const printButton = document.querySelector("#print-ledger");
const formTitle = document.querySelector("#form-title");
const formStatus = document.querySelector("#form-status");
const splitPanel = document.querySelector("#split-panel");
const splitFormFields = document.querySelector("#split-form-fields");
const ledgerBody = document.querySelector("#ledger-body");
const ledgerFooter = document.querySelector("#ledger-footer");
const ledgerTable = document.querySelector("#logbook-table");
const ledgerScroller = document.querySelector(".ledger-stage .table-scroller");
const printLedgerPages = document.querySelector("#print-ledger-pages");
const entryList = document.querySelector("#entry-list");
const emptyState = document.querySelector("#empty-state");
const entryCount = document.querySelector("#entry-count");
const flightHours = document.querySelector("#flight-hours");
const landingCount = document.querySelector("#landing-count");
const sumStatus = document.querySelector("#sum-status");
const sumConsole = document.querySelector(".sum-console");
const bulkStatus = document.querySelector("#bulk-status");
const bulkConsole = document.querySelector(".bulk-console");
const ledgerModeStatus = document.querySelector("#ledger-mode-status");
const ledgerModeToggle = document.querySelector(".ledger-mode-toggle");
const hideZeroValuesToggle = document.querySelector("#hide-zero-values");
const hideEmptyColumnsToggle = document.querySelector("#hide-empty-columns");
const deleteSelectedButton = document.querySelector("#delete-selected");
const deleteAllButton = document.querySelector("#delete-all");
const ledgerColgroupMarkup = ledgerTable.querySelector("colgroup").outerHTML;
const ledgerHeadMarkup = ledgerTable.querySelector("thead").outerHTML;

boot();

function boot() {
  buildSplitEditor();
  bindEvents();
  seedDefaultDate();
  render();
}

function bindEvents() {
  form.addEventListener("submit", handleSaveEntry);
  splitEntryButton.addEventListener("click", () => startSplitEntry());
  cancelSplitButton.addEventListener("click", cancelSplitEntry);
  deleteEntryButton.addEventListener("click", handleEditorDelete);
  resetFormButton.addEventListener("click", clearEditor);
  printButton.addEventListener("click", () => window.print());

  entryList.addEventListener("click", handleEntryCardAction);
  entryList.addEventListener("change", handleEntrySelectionChange);
  entryList.addEventListener("dragstart", handleDragStart);
  entryList.addEventListener("dragover", handleDragOver);
  entryList.addEventListener("drop", handleDrop);
  entryList.addEventListener("dragend", clearDragMarkers);
  sumConsole.addEventListener("click", handleSumConsoleAction);
  bulkConsole.addEventListener("click", handleBulkConsoleAction);
  ledgerModeToggle.addEventListener("click", handleLedgerModeAction);
  ledgerScroller.addEventListener("scroll", syncStickyLedgerHeaderOffsets);
  hideZeroValuesToggle.addEventListener("change", handleDisplayPreferenceChange);
  hideEmptyColumnsToggle.addEventListener("change", handleDisplayPreferenceChange);
  window.addEventListener("resize", syncStickyLedgerHeaderOffsets);

  ledgerBody.addEventListener("click", (event) => {
    const row = event.target.closest(".filled-row[data-entry-id]");
    if (!row) {
      return;
    }

    if (state.ledgerInteractionMode === "select") {
      toggleSumSelection(row.dataset.entryId, { preserveLedgerView: true });
      return;
    }

    editEntry(row.dataset.entryId);
  });
}

function handleSaveEntry(event) {
  event.preventDefault();

  const entry = readFormEntry();
  if (!isEntryValid(entry)) {
    formStatus.textContent = "Complete Date, Type, Registration, and Pilot in command before saving.";
    return;
  }

  const entryIdToReveal = state.editingId;

  if (state.splitSourceId) {
    const splitEntry = readFormEntry(SPLIT_FIELD_PREFIX);
    if (!isEntryValid(splitEntry)) {
      formStatus.textContent =
        "Complete Date, Type, Registration, and Pilot in command in both split entries.";
      return;
    }

    saveSplitEntries(entry, splitEntry);
    return;
  }

  if (entryIdToReveal) {
    state.entries = state.entries.map((item) =>
      item.id === entryIdToReveal ? { ...item, ...entry, updatedAt: new Date().toISOString() } : item
    );
  } else {
    const newEntry = {
      id: createId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...entry,
    };

    state.entries.unshift(newEntry);
    state.selectedSumIds.add(newEntry.id);
  }

  persistEntries();
  persistSelectedSumIds();
  resetEditorState();
  render();

  if (entryIdToReveal) {
    revealLedgerEntry(entryIdToReveal);
  }
}

function readFormEntry(prefix = "") {
  const formData = new FormData(form);

  return ENTRY_FIELDS.reduce((entry, field) => {
    const rawValue = String(formData.get(`${prefix}${field}`) ?? "").trim();
    entry[field] = normalizeField(field, rawValue);
    return entry;
  }, {});
}

function normalizeField(field, rawValue) {
  if (!rawValue) {
    return "";
  }

  if (INTEGER_FIELDS.includes(field)) {
    const numericValue = Math.max(0, Math.round(Number(rawValue)));
    return Number.isFinite(numericValue) ? String(numericValue) : "";
  }

  if (DECIMAL_FIELDS.includes(field)) {
    const numericValue = Math.max(0, Number(rawValue));
    return Number.isFinite(numericValue) ? trimZeroes(numericValue.toFixed(1)) : "";
  }

  return rawValue;
}

function clearEditor(options = {}) {
  resetEditorState(options);
  render();
}

function resetEditorState(options = {}) {
  form.reset();
  state.editingId = null;
  state.splitSourceId = null;
  clearSplitEditorFields();
  formStatus.textContent = options.preserveMessage
    ? formStatus.textContent
    : "New entries are saved to this browser automatically.";
  seedDefaultDate();
}

function seedDefaultDate() {
  const dateInput = form.elements.date;
  if (dateInput && !dateInput.value) {
    dateInput.value = formatDateInput(new Date());
  }
}

function editEntry(entryId) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) {
    return;
  }

  if (state.splitSourceId && state.splitSourceId !== entryId) {
    state.splitSourceId = null;
    clearSplitEditorFields();
  }

  state.editingId = entry.id;
  ENTRY_FIELDS.forEach((field) => {
    const input = form.elements[field];
    if (!input) {
      return;
    }
    input.value = entry[field] ?? "";
  });

  formStatus.textContent = "Editing an existing row. Save to update the ledger in place.";
  render();
  scrollEditorIntoView();
}

function handleEntryCardAction(event) {
  if (event.target.closest(".entry-select")) {
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) {
    const card = event.target.closest("[data-entry-id]");
    if (card) {
      editEntry(card.dataset.entryId);
    }
    return;
  }

  const card = actionButton.closest("[data-entry-id]");
  if (!card) {
    return;
  }

  const entryId = card.dataset.entryId;
  const action = actionButton.dataset.action;

  if (action === "edit") {
    editEntry(entryId);
    return;
  }

  if (action === "split") {
    startSplitEntry(entryId);
    return;
  }

  if (action === "delete") {
    deleteEntry(entryId);
    return;
  }

  if (action === "toggle-sum") {
    toggleSumSelection(entryId);
    return;
  }

  if (action === "move-up") {
    moveEntry(entryId, -1);
    return;
  }

  if (action === "move-down") {
    moveEntry(entryId, 1);
  }
}

function handleEntrySelectionChange(event) {
  const checkbox = event.target.closest("[data-bulk-select]");
  if (!checkbox) {
    return;
  }

  toggleBulkSelection(checkbox.value, checkbox.checked);
}

function deleteEntry(entryId) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) {
    return;
  }

  const ok = window.confirm(
    `Delete the entry for ${formatLedgerDate(entry.date)} ${entry.type} ${entry.registration}?`
  );
  if (!ok) {
    return;
  }

  state.entries = state.entries.filter((item) => item.id !== entryId);
  state.selectedSumIds.delete(entryId);
  state.selectedDeleteIds.delete(entryId);
  if (state.editingId === entryId) {
    resetEditorState({ preserveMessage: true });
  }
  persistEntries();
  persistSelectedSumIds();
  render();
}

function handleEditorDelete() {
  if (!state.editingId) {
    return;
  }

  deleteEntry(state.editingId);
}

function moveEntry(entryId, direction) {
  const currentIndex = state.entries.findIndex((item) => item.id === entryId);
  const targetIndex = currentIndex + direction;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= state.entries.length) {
    return;
  }

  const reordered = [...state.entries];
  const [entry] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, entry);
  state.entries = reordered;
  persistEntries();
  persistSelectedSumIds();
  render();
}

function handleDragStart(event) {
  const card = event.target.closest("[data-entry-id]");
  if (!card) {
    return;
  }

  state.dragId = card.dataset.entryId;
  card.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", state.dragId);
}

function handleDragOver(event) {
  event.preventDefault();
  const targetCard = event.target.closest("[data-entry-id]");

  resetDropMarkers();

  if (!targetCard || targetCard.dataset.entryId === state.dragId) {
    return;
  }

  const bounds = targetCard.getBoundingClientRect();
  const placeAfter = event.clientY > bounds.top + bounds.height / 2;
  targetCard.classList.add(placeAfter ? "drop-after" : "drop-before");
  state.dragPosition = {
    targetId: targetCard.dataset.entryId,
    placeAfter,
  };
}

function handleDrop(event) {
  event.preventDefault();

  if (!state.dragId || !state.dragPosition) {
    clearDragMarkers();
    return;
  }

  const fromIndex = state.entries.findIndex((item) => item.id === state.dragId);
  const targetIndex = state.entries.findIndex((item) => item.id === state.dragPosition.targetId);

  if (fromIndex < 0 || targetIndex < 0) {
    clearDragMarkers();
    return;
  }

  const reordered = [...state.entries];
  const [draggedEntry] = reordered.splice(fromIndex, 1);
  const insertIndex =
    fromIndex < targetIndex
      ? targetIndex + (state.dragPosition.placeAfter ? 0 : -1)
      : targetIndex + (state.dragPosition.placeAfter ? 1 : 0);

  reordered.splice(insertIndex, 0, draggedEntry);
  state.entries = reordered;
  persistEntries();
  persistSelectedSumIds();
  clearDragMarkers();
  render();
}

function handleSumConsoleAction(event) {
  const button = event.target.closest("[data-sum-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.sumAction;
  if (action === "select-all") {
    state.selectedSumIds = new Set(state.entries.map((entry) => entry.id));
  }

  if (action === "clear") {
    state.selectedSumIds = new Set();
  }

  persistSelectedSumIds();
  render();
}

function handleBulkConsoleAction(event) {
  const button = event.target.closest("[data-bulk-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.bulkAction;

  if (action === "select-all") {
    state.selectedDeleteIds = new Set(state.entries.map((entry) => entry.id));
    render();
    return;
  }

  if (action === "clear") {
    state.selectedDeleteIds = new Set();
    render();
    return;
  }

  if (action === "delete-selected") {
    deleteSelectedEntries();
    return;
  }

  if (action === "delete-all") {
    deleteAllEntries();
  }
}

function handleLedgerModeAction(event) {
  const button = event.target.closest("[data-ledger-mode]");
  if (!button) {
    return;
  }

  state.ledgerInteractionMode = button.dataset.ledgerMode === "select" ? "select" : "edit";
  renderLedgerMode();
}

function handleDisplayPreferenceChange() {
  state.hideZeroValues = hideZeroValuesToggle.checked;
  state.hideEmptyColumns = hideEmptyColumnsToggle.checked;
  persistDisplayPreferences();
  render();
}

function startSplitEntry(entryId = state.editingId) {
  const sourceId = entryId || state.editingId;
  if (!sourceId) {
    return;
  }

  if (state.editingId !== sourceId) {
    editEntry(sourceId);
  }

  const sourceEntry = state.entries.find((item) => item.id === sourceId);
  if (!sourceEntry) {
    return;
  }

  state.splitSourceId = sourceId;
  fillSplitEditorFields(sourceEntry);
  formStatus.textContent =
    "Split mode is active. Edit both entries and save them back into the original row position.";
  render();
  scrollEditorIntoView();
}

function cancelSplitEntry() {
  if (!state.splitSourceId) {
    return;
  }

  state.splitSourceId = null;
  clearSplitEditorFields();
  formStatus.textContent = state.editingId
    ? "Editing an existing row. Save to update the ledger in place."
    : "New entries are saved to this browser automatically.";
  render();
}

function deleteSelectedEntries() {
  const selectedEntries = state.entries.filter((entry) => state.selectedDeleteIds.has(entry.id));
  if (!selectedEntries.length) {
    return;
  }

  const message =
    selectedEntries.length === state.entries.length
      ? `Delete all ${selectedEntries.length} saved entries?`
      : `Delete ${selectedEntries.length} selected entr${selectedEntries.length === 1 ? "y" : "ies"}?`;

  if (!window.confirm(message)) {
    return;
  }

  const selectedIds = new Set(selectedEntries.map((entry) => entry.id));
  state.entries = state.entries.filter((entry) => !selectedIds.has(entry.id));
  state.selectedDeleteIds = new Set();
  state.selectedSumIds = new Set(
    [...state.selectedSumIds].filter((entryId) => !selectedIds.has(entryId))
  );

  if (state.editingId && selectedIds.has(state.editingId)) {
    resetEditorState();
  }

  persistEntries();
  persistSelectedSumIds();
  render();
}

function deleteAllEntries() {
  if (!state.entries.length) {
    return;
  }

  if (!window.confirm(`Delete all ${state.entries.length} saved entries?`)) {
    return;
  }

  state.entries = [];
  state.selectedDeleteIds = new Set();
  state.selectedSumIds = new Set();
  resetEditorState();

  persistEntries();
  persistSelectedSumIds();
  render();
}

function saveSplitEntries(primaryEntry, secondaryEntry) {
  const sourceIndex = state.entries.findIndex((item) => item.id === state.splitSourceId);
  const sourceEntry = state.entries[sourceIndex];
  if (sourceIndex < 0 || !sourceEntry) {
    return;
  }

  const timestamp = new Date().toISOString();
  const secondEntryId = createId();
  const shouldCarrySum = state.selectedSumIds.has(sourceEntry.id);
  const shouldCarryBulk = state.selectedDeleteIds.has(sourceEntry.id);
  const firstEntry = {
    ...sourceEntry,
    ...primaryEntry,
    updatedAt: timestamp,
  };
  const secondEntry = {
    ...sourceEntry,
    ...secondaryEntry,
    id: secondEntryId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const reorderedEntries = [...state.entries];
  reorderedEntries.splice(sourceIndex, 1, firstEntry, secondEntry);
  state.entries = reorderedEntries;

  if (shouldCarrySum) {
    state.selectedSumIds.add(secondEntryId);
  } else {
    state.selectedSumIds.delete(secondEntryId);
  }

  if (shouldCarryBulk) {
    state.selectedDeleteIds.add(secondEntryId);
  } else {
    state.selectedDeleteIds.delete(secondEntryId);
  }

  resetEditorState();
  persistEntries();
  persistSelectedSumIds();
  render();
  revealLedgerEntry(firstEntry.id);
}

function clearDragMarkers() {
  state.dragId = null;
  state.dragPosition = null;
  resetDropMarkers();
  entryList.querySelectorAll(".entry-card").forEach((card) => {
    card.classList.remove("is-dragging");
  });
}

function resetDropMarkers() {
  entryList.querySelectorAll(".entry-card").forEach((card) => {
    card.classList.remove("drop-before", "drop-after");
  });
}

function render() {
  renderSummary();
  renderEditorMode();
  renderSumConsole();
  renderBulkConsole();
  renderLedgerMode();
  renderDisplayPreferences();
  renderManifest();
  renderLedger();
  renderPrintLedgerPages();
  syncStickyLedgerHeaderOffsets();
}

function renderSummary() {
  const totalHours = state.entries.reduce((sum, entry) => sum + sumTimeColumns(entry), 0);
  const totalLandings = state.entries.reduce(
    (sum, entry) => sum + toNumber(entry.landingsDay) + toNumber(entry.landingsNight),
    0
  );

  entryCount.textContent = String(state.entries.length);
  flightHours.textContent = formatTotal(totalHours);
  landingCount.textContent = String(totalLandings);
}

function renderManifest() {
  emptyState.hidden = state.entries.length > 0;
  entryList.innerHTML = state.entries
    .map((entry, index) => createEntryCard(entry, index))
    .join("");
}

function renderBulkConsole() {
  const totalRows = state.entries.length;
  const selectedRows = state.selectedDeleteIds.size;

  if (!totalRows) {
    bulkStatus.textContent = "Save entries to unlock bulk selection and bulk delete.";
  } else if (!selectedRows) {
    bulkStatus.textContent = "Select one or more entries to delete them together.";
  } else if (selectedRows === totalRows) {
    bulkStatus.textContent = `All ${totalRows} entries are selected for bulk delete.`;
  } else {
    bulkStatus.textContent = `${selectedRows} of ${totalRows} entries selected for bulk delete.`;
  }

  deleteSelectedButton.textContent = selectedRows
    ? `Delete selected (${selectedRows})`
    : "Delete selected";
  deleteSelectedButton.disabled = selectedRows === 0;
  deleteAllButton.disabled = totalRows === 0;
}

function renderSumConsole() {
  const totalRows = state.entries.length;
  const selectedRows = getSelectedEntries().length;

  if (!totalRows) {
    sumStatus.textContent = "Save entries to activate automatic and manual column sums.";
    return;
  }

  if (selectedRows === totalRows) {
    sumStatus.textContent = `Default totals are using all ${totalRows} saved rows.`;
    return;
  }

  if (!selectedRows) {
    sumStatus.textContent = "No rows are selected for the manual sum right now.";
    return;
  }

  sumStatus.textContent = `Manual sum is using ${selectedRows} of ${totalRows} saved rows.`;
}

function renderEditorMode() {
  const isSplitMode = Boolean(state.splitSourceId);
  const isEditMode = Boolean(state.editingId);

  splitPanel.hidden = !isSplitMode;
  splitEntryButton.hidden = !isEditMode || isSplitMode;
  cancelSplitButton.hidden = !isSplitMode;
  deleteEntryButton.hidden = !isEditMode || isSplitMode;

  if (isSplitMode) {
    formTitle.textContent = "Split flight entry";
    saveButton.textContent = "Save split entries";
    return;
  }

  if (isEditMode) {
    formTitle.textContent = "Edit flight entry";
    saveButton.textContent = "Update entry";
    return;
  }

  formTitle.textContent = "Add a flight entry";
  saveButton.textContent = "Save entry";
}

function renderLedgerMode() {
  if (!ledgerModeToggle || !ledgerModeStatus) {
    return;
  }

  const isSelectMode = state.ledgerInteractionMode === "select";
  ledgerModeStatus.textContent = isSelectMode
    ? "Select mode is on. Click filled ledger rows to add or remove them from the manual subtotal."
    : "Edit mode is on. Click a filled row to edit it, or switch to Select rows to choose entries for the manual subtotal.";

  ledgerModeToggle.querySelectorAll("[data-ledger-mode]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.ledgerMode === state.ledgerInteractionMode);
  });
}

function renderDisplayPreferences() {
  hideZeroValuesToggle.checked = state.hideZeroValues;
  hideEmptyColumnsToggle.checked = state.hideEmptyColumns;
}

function createEntryCard(entry, index) {
  const isActive = entry.id === state.editingId;
  const isSelectedForSum = state.selectedSumIds.has(entry.id);
  const isSelectedForDelete = state.selectedDeleteIds.has(entry.id);

  return `
    <li class="entry-card ${isActive ? "is-active" : ""} ${isSelectedForSum ? "is-in-sum" : ""} ${isSelectedForDelete ? "is-bulk-selected" : ""}" data-entry-id="${entry.id}" draggable="true">
      <div class="entry-card__top">
        <div>
          <p class="entry-card__title">${escapeHtml(formatLedgerDate(entry.date))} • ${escapeHtml(entry.type)}</p>
          <p class="entry-card__subtitle">${escapeHtml(entry.registration)} • ${escapeHtml(entry.pilotInCommand)}</p>
        </div>
        <div class="entry-card__controls">
          <label class="entry-select" aria-label="Select entry for bulk delete">
            <input class="entry-select__checkbox" type="checkbox" data-bulk-select value="${entry.id}" ${isSelectedForDelete ? "checked" : ""} />
            <span>Select</span>
          </label>
          <span class="entry-card__handle" aria-hidden="true">:::</span>
        </div>
      </div>
      <div class="entry-card__meta">
        <span class="chip">${escapeHtml(sumTimeColumns(entry, true))} hrs</span>
        <span class="chip">${escapeHtml(entry.landingsDay || "0")} day landings</span>
        <span class="chip">${escapeHtml(entry.landingsNight || "0")} night landings</span>
        <span class="chip ${isSelectedForSum ? "is-selected" : "is-deselected"}">
          ${isSelectedForSum ? "Included in manual sum" : "Excluded from manual sum"}
        </span>
        ${isSelectedForDelete ? '<span class="chip is-deselected">Selected for delete</span>' : ""}
        <span class="chip">Row ${index + 1}</span>
      </div>
      <div class="entry-card__actions">
        <button type="button" class="mini-button" data-action="edit">Edit</button>
        <button type="button" class="mini-button" data-action="split">Split</button>
        <button type="button" class="mini-button ${isSelectedForSum ? "is-selected" : ""}" data-action="toggle-sum">
          ${isSelectedForSum ? "Sum on" : "Use in sum"}
        </button>
        <button type="button" class="mini-button" data-action="move-up">Move up</button>
        <button type="button" class="mini-button" data-action="move-down">Move down</button>
        <button type="button" class="mini-button" data-action="delete">Delete</button>
      </div>
    </li>
  `;
}

function renderLedger() {
  const rows = state.entries.map((entry) => createLedgerRow(entry)).join("");
  const blankCount = Math.max(PRINT_PAGE_ENTRY_LIMIT - state.entries.length, PRINT_PAGE_MIN_BLANK_ROWS);
  const blanks = Array.from({ length: blankCount }, () => createBlankRow()).join("");

  ledgerBody.innerHTML = rows + blanks;
  ledgerFooter.innerHTML = createFooter();
  applyLedgerColumnVisibility();
}

function renderPrintLedgerPages() {
  if (!printLedgerPages) {
    return;
  }

  const entryPages = chunkEntries(state.entries, PRINT_PAGE_ENTRY_LIMIT);
  const pages = entryPages.length ? entryPages : [[]];

  printLedgerPages.innerHTML = pages
    .map((entries, index) => createPrintLedgerPage(entries, index, pages.length))
    .join("");
}

function createLedgerRow(entry) {
  const cells = LEDGER_FIELDS.map((field, index) => {
    const value = formatLedgerCell(field, entry[field]);
    const classes = [
      isCenteredField(field) ? "cell-center" : "",
      field === "remarks" && !value ? "cell-note" : "",
      field === "flightDetails" || field === "remarks" ? "cell-wrap" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return `<td class="${classes}" data-column-index="${index + 1}">${escapeHtml(value)}</td>`;
  }).join("");

  return `
    <tr class="filled-row ${entry.id === state.editingId ? "is-active" : ""} ${state.selectedSumIds.has(entry.id) ? "is-in-sum" : ""} ${state.selectedDeleteIds.has(entry.id) ? "is-bulk-selected" : ""}" data-entry-id="${entry.id}">
      ${cells}
    </tr>
  `;
}

function createBlankRow() {
  return `
    <tr class="blank-row" aria-hidden="true">
      ${Array.from({ length: LEDGER_FIELDS.length }, (_, index) => `<td data-column-index="${index + 1}">&nbsp;</td>`).join("")}
    </tr>
  `;
}

function createPrintLedgerPage(entries, pageIndex, totalPages) {
  const rows = entries.map((entry) => createLedgerRow(entry)).join("");
  const blankCount = Math.max(PRINT_PAGE_ENTRY_LIMIT - entries.length, PRINT_PAGE_MIN_BLANK_ROWS);
  const blanks = Array.from({ length: blankCount }, () => createBlankRow()).join("");
  const pageLabel = totalPages > 1 ? `Page ${pageIndex + 1} of ${totalPages}` : "Landscape print sheet";

  return `
    <article class="print-sheet">
      <div class="paper-frame">
        <div class="paper-sheet">
          <div class="paper-title">
            <div>
              <p class="paper-label">Pilot Logbook</p>
              <h3>Flight entries ledger</h3>
            </div>
            <div class="paper-meta">
              <p class="paper-credit">${escapeHtml(pageLabel)}</p>
              <p class="paper-credit">Made by Uran Khatola</p>
            </div>
          </div>
          <div class="table-scroller">
            <table class="logbook-table">
              ${ledgerColgroupMarkup}
              ${ledgerHeadMarkup}
              <tbody>${rows + blanks}</tbody>
              ${pageIndex === totalPages - 1 ? `<tfoot>${createFooter()}</tfoot>` : ""}
            </table>
          </div>
        </div>
      </div>
    </article>
  `;
}

function createFooter() {
  const selectedEntries = getSelectedEntries();

  return `
    ${createSumFooterRow({
      label: "Automatic sum • all saved rows",
      entries: state.entries,
      note: state.entries.length
        ? `Rows included: ${state.entries.length} • Flight time cols 14 to 29: ${formatFooterNumber(
            state.entries.reduce((sum, entry) => sum + sumTimeColumns(entry), 0)
          )}`
        : "Only numeric columns are totaled.",
    })}
    ${createSumFooterRow({
      label: "Manual sum • selected rows",
      entries: selectedEntries,
      note: state.entries.length
        ? `${selectedEntries.length} of ${state.entries.length} rows selected for the custom subtotal`
        : "Save entries to start building a manual subtotal.",
      isManual: true,
    })}
  `;
}

function createSumFooterRow({ label, entries, note, isManual = false }) {
  const hasAnyRows = state.entries.length > 0;
  const totals = SUMMABLE_FIELDS.map((field) =>
    formatFooterNumber(
      entries.reduce((sum, entry) => sum + toNumber(entry[field]), 0),
      INTEGER_FIELDS.includes(field),
      hasAnyRows
    )
  );

  return `
    <tr>
      <th colspan="7" class="footer-label" data-footer-label="true">${escapeHtml(label)}</th>
      ${totals
        .map((value, index) => `<td class="cell-center" data-column-index="${index + 8}">${value}</td>`)
        .join("")}
      <td class="footer-note" data-column-index="32">${escapeHtml(note)}</td>
    </tr>
  `;
}

function chunkEntries(entries, chunkSize) {
  if (!entries.length) {
    return [];
  }

  const pages = [];

  for (let index = 0; index < entries.length; index += chunkSize) {
    pages.push(entries.slice(index, index + chunkSize));
  }

  return pages;
}

function buildSplitEditor() {
  if (!splitFormFields) {
    return;
  }

  const sections = [...form.querySelectorAll(".form-section")];
  splitFormFields.innerHTML = sections
    .map((section) =>
      section.outerHTML
        .replace(/name="([^"]+)"/g, (_, name) => `name="${SPLIT_FIELD_PREFIX}${name}"`)
        .replace(/\srequired(="[^"]*")?/g, "")
    )
    .join("");
}

function applyLedgerColumnVisibility() {
  if (!ledgerTable) {
    return;
  }

  const visibleColumns = getVisibleLedgerColumns();

  [...ledgerTable.querySelectorAll("colgroup col")].forEach((col, index) => {
    col.classList.toggle("is-column-hidden", !visibleColumns.has(index + 1));
  });

  applyLeafCellVisibility(ledgerTable.querySelectorAll("thead tr.index-row th"), visibleColumns);
  applyLeafCellVisibility(ledgerTable.querySelectorAll("tbody tr td"), visibleColumns);
  applyMergedHeaderVisibility("group", visibleColumns);
  applyMergedHeaderVisibility("subgroup", visibleColumns);
  applyMergedHeaderVisibility("micro", visibleColumns);
  applyFooterVisibility(visibleColumns);
}

function getVisibleLedgerColumns() {
  if (!state.hideEmptyColumns || !state.entries.length) {
    return new Set(ALL_LEDGER_COLUMN_INDICES);
  }

  const visibleColumns = new Set();

  LEDGER_FIELDS.forEach((field, index) => {
    const hasVisibleValue = state.entries.some((entry) => hasVisibleLedgerValue(field, entry[field]));
    if (hasVisibleValue) {
      visibleColumns.add(index + 1);
    }
  });

  return visibleColumns.size ? visibleColumns : new Set(ALL_LEDGER_COLUMN_INDICES);
}

function hasVisibleLedgerValue(field, value) {
  if (SUMMABLE_FIELDS.includes(field)) {
    return toNumber(value) !== 0;
  }

  return String(value ?? "").trim() !== "";
}

function applyLeafCellVisibility(cells, visibleColumns) {
  [...cells].forEach((cell, index) => {
    const columnIndex = Number(cell.dataset.columnIndex || index + 1);
    cell.dataset.columnIndex = String(columnIndex);
    cell.classList.toggle("is-column-hidden", !visibleColumns.has(columnIndex));
  });
}

function applyMergedHeaderVisibility(rowKey, visibleColumns) {
  const row = ledgerTable.querySelector(`thead tr.${rowKey}-row`);
  if (!row) {
    return;
  }

  [...row.children].forEach((cell, index) => {
    const coveredColumns = HEADER_SPAN_MAP[rowKey][index];
    const visibleCount = coveredColumns.filter((columnIndex) => visibleColumns.has(columnIndex)).length;

    cell.classList.toggle("is-column-hidden", visibleCount === 0);

    if (visibleCount === 0) {
      return;
    }

    if (coveredColumns.length > 1) {
      cell.colSpan = visibleCount;
    }
  });
}

function applyFooterVisibility(visibleColumns) {
  const leadingVisibleColumns = ALL_LEDGER_COLUMN_INDICES.filter((index) => index <= 7 && visibleColumns.has(index)).length;

  ledgerFooter.querySelectorAll("[data-footer-label]").forEach((cell) => {
    cell.colSpan = Math.max(leadingVisibleColumns, 1);
  });

  ledgerFooter.querySelectorAll("[data-column-index]").forEach((cell) => {
    const columnIndex = Number(cell.dataset.columnIndex);
    cell.classList.toggle("is-column-hidden", !visibleColumns.has(columnIndex));
  });
}

function formatLedgerCell(field, value) {
  if (!value) {
    return "";
  }

  if (state.hideZeroValues && SUMMABLE_FIELDS.includes(field) && toNumber(value) === 0) {
    return "";
  }

  if (field === "date") {
    return formatLedgerDate(value);
  }

  return value;
}

function isCenteredField(field) {
  return field !== "flightDetails" && field !== "remarks" && field !== "pilotInCommand";
}

function sumTimeColumns(entry, asText = false) {
  const total = TIME_FIELDS.reduce((sum, field) => sum + toNumber(entry[field]), 0);
  return asText ? formatTotal(total) : total;
}

function formatFooterNumber(value, integer = false, showZero = true) {
  if (!value && !showZero) {
    return "";
  }

  return integer ? String(Math.round(value)) : formatTotal(value);
}

function formatTotal(value) {
  return trimZeroes(value.toFixed(1));
}

function trimZeroes(value) {
  return value.replace(/\.0$/, ".0").replace(/(\.\d*[1-9])0+$/, "$1");
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((entry) => ({ ...DEFAULT_ENTRY, ...entry }));
  } catch (error) {
    return [];
  }
}

function loadSelectedSumIds(entries) {
  try {
    const raw = localStorage.getItem(SUM_SELECTION_KEY);
    if (raw === null) {
      return entries.map((entry) => entry.id);
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return entries.map((entry) => entry.id);
    }

    const entryIds = new Set(entries.map((entry) => entry.id));
    return parsed.filter((entryId) => entryIds.has(entryId));
  } catch (error) {
    return entries.map((entry) => entry.id);
  }
}

function loadDisplayPreferences() {
  try {
    const raw = localStorage.getItem(DISPLAY_PREFERENCES_KEY);
    if (!raw) {
      return { hideZeroValues: false, hideEmptyColumns: false };
    }

    const parsed = JSON.parse(raw);
    return {
      hideZeroValues: Boolean(parsed?.hideZeroValues),
      hideEmptyColumns: Boolean(parsed?.hideEmptyColumns),
    };
  } catch (error) {
    return { hideZeroValues: false, hideEmptyColumns: false };
  }
}

function persistEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function persistSelectedSumIds() {
  const orderedSelection = state.entries
    .map((entry) => entry.id)
    .filter((entryId) => state.selectedSumIds.has(entryId));

  localStorage.setItem(SUM_SELECTION_KEY, JSON.stringify(orderedSelection));
}

function persistDisplayPreferences() {
  localStorage.setItem(
    DISPLAY_PREFERENCES_KEY,
    JSON.stringify({
      hideZeroValues: state.hideZeroValues,
      hideEmptyColumns: state.hideEmptyColumns,
    })
  );
}

function getSelectedEntries() {
  return state.entries.filter((entry) => state.selectedSumIds.has(entry.id));
}

function isEntryValid(entry) {
  return REQUIRED_FIELDS.every((field) => entry[field]);
}

function fillSplitEditorFields(entry) {
  ENTRY_FIELDS.forEach((field) => {
    const input = form.elements[`${SPLIT_FIELD_PREFIX}${field}`];
    if (!input) {
      return;
    }

    input.value = entry[field] ?? "";
  });
}

function clearSplitEditorFields() {
  ENTRY_FIELDS.forEach((field) => {
    const input = form.elements[`${SPLIT_FIELD_PREFIX}${field}`];
    if (!input) {
      return;
    }

    input.value = "";
  });
}

function toggleBulkSelection(entryId, forceState, options = {}) {
  const ledgerView = options.preserveLedgerView ? captureLedgerView() : null;
  const shouldSelect =
    typeof forceState === "boolean" ? forceState : !state.selectedDeleteIds.has(entryId);

  if (shouldSelect) {
    state.selectedDeleteIds.add(entryId);
  } else {
    state.selectedDeleteIds.delete(entryId);
  }

  render();

  if (ledgerView) {
    restoreLedgerView(ledgerView);
  }
}

function toggleSumSelection(entryId, options = {}) {
  const ledgerView = options.preserveLedgerView ? captureLedgerView() : null;

  if (state.selectedSumIds.has(entryId)) {
    state.selectedSumIds.delete(entryId);
  } else {
    state.selectedSumIds.add(entryId);
  }

  persistSelectedSumIds();
  render();

  if (ledgerView) {
    restoreLedgerView(ledgerView);
  }
}

function scrollEditorIntoView() {
  entryStage?.scrollIntoView({ behavior: "smooth", block: "start" });
  entryFormScroll?.scrollTo({ top: 0, behavior: "smooth" });
}

function revealLedgerEntry(entryId) {
  requestAnimationFrame(() => {
    const row = ledgerBody.querySelector(`[data-entry-id="${entryId}"]`);
    if (!row) {
      return;
    }

    row.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    row.classList.add("is-spotlight");
    window.setTimeout(() => row.classList.remove("is-spotlight"), 1800);
  });
}

function captureLedgerView() {
  return {
    scrollLeft: ledgerScroller?.scrollLeft ?? 0,
    scrollTop: ledgerScroller?.scrollTop ?? 0,
    pageScrollTop: window.scrollY,
  };
}

function restoreLedgerView(view) {
  requestAnimationFrame(() => {
    if (ledgerScroller) {
      ledgerScroller.scrollLeft = view.scrollLeft;
      ledgerScroller.scrollTop = view.scrollTop ?? 0;
    }

    window.scrollTo({ top: view.pageScrollTop ?? view.scrollTop ?? 0 });
    syncStickyLedgerHeaderOffsets();
  });
}

function syncStickyLedgerHeaderOffsets() {
  if (!ledgerTable || !ledgerScroller) {
    return;
  }

  const indexRow = ledgerTable.querySelector("thead .index-row");
  const groupRow = ledgerTable.querySelector("thead .group-row");
  const subgroupRow = ledgerTable.querySelector("thead .subgroup-row");

  const indexHeight = indexRow?.getBoundingClientRect().height ?? 0;
  const groupHeight = groupRow?.getBoundingClientRect().height ?? 0;
  const subgroupHeight = subgroupRow?.getBoundingClientRect().height ?? 0;

  ledgerScroller.style.setProperty("--sticky-index-top", "0px");
  ledgerScroller.style.setProperty("--sticky-group-top", `${indexHeight}px`);
  ledgerScroller.style.setProperty("--sticky-subgroup-top", `${indexHeight + groupHeight}px`);
  ledgerScroller.style.setProperty(
    "--sticky-micro-top",
    `${indexHeight + groupHeight + subgroupHeight}px`
  );
  ledgerScroller.classList.toggle("is-header-shadowed", ledgerScroller.scrollTop > 8);
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatLedgerDate(value) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
