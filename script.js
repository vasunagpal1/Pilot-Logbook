import {
  deleteUserEntries,
  deleteUserEntry,
  loadUserEntries,
  signInWithGooglePopup,
  signOutCurrentUser,
  subscribeToAuthState,
  upsertUserProfile,
  upsertUserEntries,
} from "./firebase-client.js";

const STORAGE_KEY = "pilot-logbook-atelier-v1";
const SUM_SELECTION_KEY = "pilot-logbook-atelier-sum-selection-v1";
const DISPLAY_PREFERENCES_KEY = "pilot-logbook-display-preferences-v1";
const IMPORTED_LOCAL_IDS_KEY = "pilot-logbook-atelier-imported-local-ids-v1";
const SPLIT_FIELD_PREFIX = "split__";
const PRINT_PAGE_ENTRY_LIMIT = 18;
const PRINT_PAGE_MIN_BLANK_ROWS = 6;
const HISTORY_LIMIT = 50;
const REQUIRED_FIELDS = ["date", "type", "registration", "pilotInCommand"];
const ALL_LEDGER_COLUMN_INDICES = Array.from({ length: 32 }, (_, index) => index + 1);
const HEADER_SPAN_MAP = {
  group: [[1], [2], [3], [4], [5], [6], [7, 8, 9], [10, 11, 12], [13], [14, 15, 16, 17, 18, 19, 20, 21], [22, 23, 24, 25, 26, 27, 28, 29], [30, 31], [32]],
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

const initialLocalEntries = loadEntries();

const state = {
  entries: initialLocalEntries,
  localEntries: initialLocalEntries,
  selectedSumIds: new Set(loadSelectedSumIds(initialLocalEntries)),
  selectedDeleteIds: new Set(),
  importedLocalIds: new Set(loadImportedLocalIds(initialLocalEntries)),
  lastBulkSelectionId: null,
  lastSumSelectionId: null,
  editingId: null,
  splitSourceId: null,
  ledgerInteractionMode: "edit",
  hideZeroValues: loadDisplayPreferences().hideZeroValues,
  hideEmptyColumns: loadDisplayPreferences().hideEmptyColumns,
  dragId: null,
  dragPosition: null,
  user: null,
  authResolved: false,
  storageMode: "guest",
  isBusy: false,
  syncFeedback: "",
};

const historyState = {
  undoStack: [],
  redoStack: [],
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
const storageModeValue = document.querySelector("#storage-mode");
const summaryIfActual = document.querySelector("#summary-if-actual");
const summaryFstd = document.querySelector("#summary-fstd");
const summarySeDual = document.querySelector("#summary-se-dual");
const summaryPicDay = document.querySelector("#summary-pic-day");
const summaryPicNight = document.querySelector("#summary-pic-night");
const summaryMeDual = document.querySelector("#summary-me-dual");
const sumStatus = document.querySelector("#sum-status");
const sumConsole = document.querySelector(".sum-console");
const bulkStatus = document.querySelector("#bulk-status");
const bulkConsole = document.querySelector(".bulk-console");
const manifestStatus = document.querySelector("#manifest-status");
const ledgerModeStatus = document.querySelector("#ledger-mode-status");
const ledgerModeToggle = document.querySelector(".ledger-mode-toggle");
const hideZeroValuesToggle = document.querySelector("#hide-zero-values");
const hideEmptyColumnsToggle = document.querySelector("#hide-empty-columns");
const deleteSelectedButton = document.querySelector("#delete-selected");
const deleteAllButton = document.querySelector("#delete-all");
const signInButton = document.querySelector("#sign-in-button");
const signOutButton = document.querySelector("#sign-out-button");
const importLocalButton = document.querySelector("#import-local-button");
const exportDataButton = document.querySelector("#export-data-button");
const importFileButton = document.querySelector("#import-file-button");
const importFileInput = document.querySelector("#import-file-input");
const undoButton = document.querySelector("#undo-button");
const redoButton = document.querySelector("#redo-button");
const historyStatus = document.querySelector("#history-status");
const syncBadge = document.querySelector("#sync-badge");
const syncAvatar = document.querySelector("#sync-avatar");
const authStatus = document.querySelector("#auth-status");
const syncMessage = document.querySelector("#sync-message");
const syncCloudStat = document.querySelector("#sync-cloud-stat");
const syncPendingStat = document.querySelector("#sync-pending-stat");
const syncCloudCount = document.querySelector("#sync-cloud-count");
const syncPendingCount = document.querySelector("#sync-pending-count");
const syncSummary = document.querySelector("#sync-summary");
const syncFeedback = document.querySelector("#sync-feedback");
const ledgerColgroupMarkup = ledgerTable.querySelector("colgroup").outerHTML;
const ledgerHeadMarkup = ledgerTable.querySelector("thead").outerHTML;

boot();

async function boot() {
  buildSplitEditor();
  bindEvents();
  seedDefaultDate();
  render();
  await subscribeToAuthState(handleAuthStateChange);
}

function bindEvents() {
  form.addEventListener("submit", handleSaveEntry);
  splitEntryButton.addEventListener("click", () => startSplitEntry());
  cancelSplitButton.addEventListener("click", cancelSplitEntry);
  deleteEntryButton.addEventListener("click", handleEditorDelete);
  resetFormButton.addEventListener("click", clearEditor);
  printButton.addEventListener("click", () => window.print());
  signInButton.addEventListener("click", handleSignIn);
  signOutButton.addEventListener("click", handleSignOut);
  importLocalButton.addEventListener("click", handleImportLocalToCloud);
  exportDataButton.addEventListener("click", handleExportData);
  importFileButton.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", handleImportFileSelection);
  undoButton.addEventListener("click", () => undoHistory());
  redoButton.addEventListener("click", () => redoHistory());

  entryList.addEventListener("click", handleEntryCardAction);
  entryList.addEventListener("click", handleEntrySelectionIntent, true);
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
  document.addEventListener("keydown", handleHistoryShortcut);
  window.addEventListener("resize", syncStickyLedgerHeaderOffsets);

  ledgerBody.addEventListener("click", (event) => {
    const row = event.target.closest(".filled-row[data-entry-id]");
    if (!row) {
      return;
    }

    if (state.ledgerInteractionMode === "select") {
      toggleSumSelection(row.dataset.entryId, { preserveLedgerView: true, range: event.shiftKey });
      return;
    }

    editEntry(row.dataset.entryId);
  });
}

async function handleAuthStateChange(user) {
  state.user = user ?? null;
  state.authResolved = true;
  clearSessionHistory();

  if (!user) {
    state.storageMode = "guest";
    applyEntries(state.localEntries);
    state.isBusy = false;
    resetEditorState({ preserveMessage: false });
    render();
    return;
  }

  state.storageMode = "cloud";
  state.isBusy = true;
  render();

  try {
    await upsertUserProfile(user);
    const cloudEntries = await loadCloudEntriesForCurrentUser();
    syncImportedLocalIdsWithCloud(cloudEntries);
    applyEntries(cloudEntries);
    state.syncFeedback = cloudEntries.length
      ? "Cloud sync is active."
      : "Signed in. Your cloud logbook is ready for its first synced entry.";
    resetEditorState({ preserveMessage: false });
  } catch (error) {
    console.error(error);
    state.syncFeedback = "Cloud data could not be loaded right now. Your guest entries are still safe on this device.";
    state.storageMode = "guest";
    applyEntries(state.localEntries);
  } finally {
    state.isBusy = false;
    render();
  }
}

async function handleSignIn() {
  if (state.isBusy) {
    return;
  }

  state.isBusy = true;
  state.syncFeedback = "";
  render();

  try {
    await signInWithGooglePopup();
    state.syncFeedback = "Signed in. Loading your cloud logbook.";
  } catch (error) {
    console.error(error);
    state.syncFeedback = error?.code === "auth/popup-closed-by-user"
      ? "Google sign-in was closed before finishing."
      : /Firebase config is not available|Firebase config is incomplete/i.test(String(error))
        ? "Cloud sign-in is only available from the Firebase-hosted site right now."
      : "Google sign-in could not be completed right now.";
  } finally {
    state.isBusy = false;
    render();
  }
}

async function handleSignOut() {
  if (state.isBusy) {
    return;
  }

  state.isBusy = true;
  render();

  try {
    await signOutCurrentUser();
    state.syncFeedback = "Signed out. You are back in guest mode on this device.";
  } catch (error) {
    console.error(error);
    state.syncFeedback = "Sign out could not be completed right now.";
    state.isBusy = false;
    render();
  }
}

async function handleImportLocalToCloud() {
  if (!isCloudMode()) {
    state.syncFeedback = "Sign in with Google first, then you can import this device's entries into cloud.";
    render();
    return;
  }

  if (state.isBusy) {
    return;
  }

  if (!state.localEntries.length) {
    state.syncFeedback = "There are no guest entries on this device to import.";
    render();
    return;
  }

  const pendingLocalImports = getPendingLocalImports();
  if (!pendingLocalImports.length) {
    state.syncFeedback = "This device's entries are already represented in your cloud logbook.";
    render();
    return;
  }

  const importedEntries = buildImportedEntries(pendingLocalImports, state.entries);
  if (!window.confirm(`Import ${importedEntries.length} new device entr${importedEntries.length === 1 ? "y" : "ies"} into your cloud logbook? Existing cloud entries will stay in place.`)) {
    return;
  }

  const beforeSnapshot = createHistorySnapshot();
  state.isBusy = true;
  render();

  try {
    await upsertUserEntries(state.user.uid, importedEntries.map(serializeEntryForCloud));
    markLocalEntriesAsImported(state.localEntries);
    applyEntries([...state.entries, ...importedEntries]);
    recordHistoryEntry(
      `Import ${importedEntries.length} device entr${importedEntries.length === 1 ? "y" : "ies"} to cloud`,
      beforeSnapshot
    );
    state.syncFeedback = `Imported ${importedEntries.length} new device entr${importedEntries.length === 1 ? "y" : "ies"} into cloud.`;
  } catch (error) {
    console.error(error);
    applySessionSnapshot(beforeSnapshot);
    persistCurrentLocalState();
    state.syncFeedback = "Import could not be completed right now.";
  } finally {
    state.isBusy = false;
    render();
  }
}

function handleExportData() {
  if (state.isBusy) {
    return;
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    mode: isCloudMode() ? "cloud" : "guest",
    entries: state.entries.map(serializeEntryForCloud),
    selectedSumIds: state.entries
      .map((entry) => entry.id)
      .filter((entryId) => state.selectedSumIds.has(entryId)),
    displayPreferences: {
      hideZeroValues: state.hideZeroValues,
      hideEmptyColumns: state.hideEmptyColumns,
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = `pilot-logbook-backup-${formatDateInput(new Date())}.json`;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(url);
  state.syncFeedback = "Backup downloaded from the current table data.";
  render();
}

async function handleImportFileSelection(event) {
  const file = event.target.files?.[0];
  importFileInput.value = "";
  let beforeSnapshot = null;
  let importedEntriesForRollback = null;

  if (!file || state.isBusy) {
    return;
  }

  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    const importedEntries = parseImportedEntries(parsed);
    importedEntriesForRollback = importedEntries;
    if (!importedEntries.length && parsed?.entries && Array.isArray(parsed.entries) && parsed.entries.length) {
      throw new Error("No valid entries were found in this backup.");
    }

    const selectedSumIds = parseImportedSelectedSumIds(parsed, importedEntries);
    const displayPreferences = parseImportedDisplayPreferences(parsed);

    const targetLabel = isCloudMode() ? "cloud logbook" : "device logbook";
    if (!window.confirm(`Replace the current ${targetLabel} with ${importedEntries.length} imported entr${importedEntries.length === 1 ? "y" : "ies"} from this backup file?`)) {
      return;
    }

    beforeSnapshot = createHistorySnapshot();
    state.isBusy = true;
    render();

    if (isCloudMode()) {
      await syncCloudEntriesToSnapshot(beforeSnapshot.entries, importedEntries);
    } else {
      setLocalEntries(importedEntries, { resetImportedIds: true });
    }

    applyEntries(importedEntries);
    state.selectedDeleteIds = new Set();
    state.selectedSumIds = new Set(selectedSumIds);
    state.hideZeroValues = displayPreferences.hideZeroValues;
    state.hideEmptyColumns = displayPreferences.hideEmptyColumns;
    persistSelectedSumIds();
    persistDisplayPreferences();
    resetEditorState();
    recordHistoryEntry("Import backup", beforeSnapshot);
    state.syncFeedback = `Imported ${importedEntries.length} entr${importedEntries.length === 1 ? "y" : "ies"} from backup into the current table.`;
  } catch (error) {
    console.error(error);
    if (beforeSnapshot && isCloudMode() && importedEntriesForRollback) {
      try {
        await syncCloudEntriesToSnapshot(importedEntriesForRollback, beforeSnapshot.entries);
      } catch (rollbackError) {
        console.error(rollbackError);
      }
    }
    if (beforeSnapshot) {
      applySessionSnapshot(beforeSnapshot);
      persistCurrentLocalState();
    }
    state.syncFeedback = "That backup file could not be imported. Please use a valid JSON export from this app.";
  } finally {
    state.isBusy = false;
    render();
  }
}

function isCloudMode() {
  return Boolean(state.user) && state.storageMode === "cloud";
}

function getDefaultFormStatus() {
  return isCloudMode()
    ? "Signed in. Entries sync to your private cloud logbook."
    : "Guest mode: new entries are saved to this browser automatically.";
}

function createHistorySnapshot() {
  return {
    entries: cloneEntryCollection(state.entries),
    localEntries: cloneEntryCollection(state.localEntries),
    selectedSumIds: [...state.selectedSumIds],
    selectedDeleteIds: [...state.selectedDeleteIds],
    importedLocalIds: [...state.importedLocalIds],
    hideZeroValues: state.hideZeroValues,
    hideEmptyColumns: state.hideEmptyColumns,
    lastBulkSelectionId: state.lastBulkSelectionId,
    lastSumSelectionId: state.lastSumSelectionId,
  };
}

function cloneEntryCollection(entries) {
  return entries.map((entry) => ({ ...serializeEntryForCloud(entry) }));
}

function getSnapshotSignature(snapshot) {
  return JSON.stringify(snapshot);
}

function clearSessionHistory() {
  historyState.undoStack = [];
  historyState.redoStack = [];
  renderHistoryConsole();
}

function recordHistoryEntry(label, beforeSnapshot) {
  const afterSnapshot = createHistorySnapshot();
  if (getSnapshotSignature(beforeSnapshot) === getSnapshotSignature(afterSnapshot)) {
    return;
  }

  historyState.undoStack.push({
    label,
    before: beforeSnapshot,
    after: afterSnapshot,
  });

  if (historyState.undoStack.length > HISTORY_LIMIT) {
    historyState.undoStack.shift();
  }

  historyState.redoStack = [];
  renderHistoryConsole();
}

function normalizeEntryCollection(entries) {
  return entries
    .map((entry, index) => normalizeStoredEntry(entry, index))
    .sort((firstEntry, secondEntry) => getEntrySortOrder(firstEntry) - getEntrySortOrder(secondEntry));
}

function applySessionSnapshot(snapshot, options = {}) {
  const nextEntries = normalizeEntryCollection(snapshot.entries || []);
  const nextLocalEntries = normalizeEntryCollection(snapshot.localEntries || []);
  const entryIds = new Set(nextEntries.map((entry) => entry.id));
  const localIds = new Set(nextLocalEntries.map((entry) => entry.id));

  state.entries = nextEntries;
  state.localEntries = nextLocalEntries;
  state.selectedSumIds = new Set((snapshot.selectedSumIds || []).filter((entryId) => entryIds.has(entryId)));
  state.selectedDeleteIds = new Set((snapshot.selectedDeleteIds || []).filter((entryId) => entryIds.has(entryId)));
  state.importedLocalIds = new Set((snapshot.importedLocalIds || []).filter((entryId) => localIds.has(entryId)));
  state.hideZeroValues = Boolean(snapshot.hideZeroValues);
  state.hideEmptyColumns = Boolean(snapshot.hideEmptyColumns);
  state.lastBulkSelectionId = entryIds.has(snapshot.lastBulkSelectionId) ? snapshot.lastBulkSelectionId : null;
  state.lastSumSelectionId = entryIds.has(snapshot.lastSumSelectionId) ? snapshot.lastSumSelectionId : null;
  clearDragMarkers();

  if (options.resetEditor) {
    resetEditorState();
  }
}

function persistCurrentLocalState() {
  persistLocalEntries();
  persistImportedLocalIds();
  persistSelectedSumIds();
  persistDisplayPreferences();
}

function haveEntriesChanged(previousEntries, nextEntries) {
  return JSON.stringify(cloneEntryCollection(previousEntries)) !== JSON.stringify(cloneEntryCollection(nextEntries));
}

async function syncCloudEntriesToSnapshot(previousEntries, nextEntries) {
  if (!isCloudMode()) {
    return;
  }

  const previousById = new Map(previousEntries.map((entry) => [entry.id, JSON.stringify(serializeEntryForCloud(entry))]));
  const nextById = new Map(nextEntries.map((entry) => [entry.id, JSON.stringify(serializeEntryForCloud(entry))]));
  const idsToDelete = [...previousById.keys()].filter((entryId) => !nextById.has(entryId));
  const entriesToUpsert = nextEntries.filter(
    (entry) => previousById.get(entry.id) !== JSON.stringify(serializeEntryForCloud(entry))
  );

  if (idsToDelete.length) {
    await deleteUserEntries(state.user.uid, idsToDelete);
  }

  if (entriesToUpsert.length) {
    await upsertUserEntries(state.user.uid, entriesToUpsert.map(serializeEntryForCloud));
  }
}

async function persistSnapshotTransition(previousSnapshot, nextSnapshot) {
  persistCurrentLocalState();

  if (isCloudMode() && haveEntriesChanged(previousSnapshot.entries, nextSnapshot.entries)) {
    await syncCloudEntriesToSnapshot(previousSnapshot.entries, nextSnapshot.entries);
  }
}

function renderHistoryConsole() {
  const nextUndo = historyState.undoStack.at(-1)?.label || "";
  const nextRedo = historyState.redoStack.at(-1)?.label || "";

  undoButton.disabled = state.isBusy || historyState.undoStack.length === 0;
  redoButton.disabled = state.isBusy || historyState.redoStack.length === 0;
  undoButton.title = nextUndo ? `Undo ${nextUndo}` : "Nothing to undo";
  redoButton.title = nextRedo ? `Redo ${nextRedo}` : "Nothing to redo";

  if (!nextUndo && !nextRedo) {
    historyStatus.textContent = "Session undo is ready. New saved changes will appear here.";
    return;
  }

  if (nextUndo && nextRedo) {
    historyStatus.textContent = `Next undo: ${nextUndo} • Next redo: ${nextRedo}`;
    return;
  }

  historyStatus.textContent = nextUndo ? `Next undo: ${nextUndo}` : `Next redo: ${nextRedo}`;
}

function isTypingTarget(target) {
  return Boolean(
    target &&
    (target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target.isContentEditable)
  );
}

function handleHistoryShortcut(event) {
  if (event.defaultPrevented || state.isBusy) {
    return;
  }

  if (!(event.metaKey || event.ctrlKey) || event.altKey) {
    return;
  }

  if (isTypingTarget(event.target)) {
    return;
  }

  const key = event.key.toLowerCase();
  if (key === "z" && event.shiftKey) {
    event.preventDefault();
    redoHistory();
    return;
  }

  if (key === "z") {
    event.preventDefault();
    undoHistory();
    return;
  }

  if (key === "y") {
    event.preventDefault();
    redoHistory();
  }
}

async function stepHistory(direction) {
  if (state.isBusy) {
    return;
  }

  const sourceStack = direction === "undo" ? historyState.undoStack : historyState.redoStack;
  const targetStack = direction === "undo" ? historyState.redoStack : historyState.undoStack;
  const record = sourceStack.at(-1);
  if (!record) {
    return;
  }

  const currentSnapshot = createHistorySnapshot();
  const targetSnapshot = direction === "undo" ? record.before : record.after;
  const ledgerView = captureLedgerView();

  state.isBusy = true;
  applySessionSnapshot(targetSnapshot, { resetEditor: true });
  render();

  try {
    await persistSnapshotTransition(currentSnapshot, targetSnapshot);
    sourceStack.pop();
    targetStack.push(record);
    if (targetStack.length > HISTORY_LIMIT) {
      targetStack.shift();
    }
    state.syncFeedback = `${direction === "undo" ? "Undid" : "Redid"} ${record.label.toLowerCase()}.`;
  } catch (error) {
    console.error(error);
    if (isCloudMode() && haveEntriesChanged(currentSnapshot.entries, targetSnapshot.entries)) {
      try {
        await syncCloudEntriesToSnapshot(targetSnapshot.entries, currentSnapshot.entries);
      } catch (rollbackError) {
        console.error(rollbackError);
      }
    }
    applySessionSnapshot(currentSnapshot);
    persistCurrentLocalState();
    state.syncFeedback = `${direction === "undo" ? "Undo" : "Redo"} could not be completed right now.`;
  } finally {
    state.isBusy = false;
    render();
    restoreLedgerView(ledgerView);
  }
}

async function undoHistory() {
  await stepHistory("undo");
}

async function redoHistory() {
  await stepHistory("redo");
}

function applyEntries(entries) {
  const normalizedEntries = normalizeEntryCollection(entries);

  state.entries = normalizedEntries;
  state.selectedDeleteIds = new Set(
    [...state.selectedDeleteIds].filter((entryId) => normalizedEntries.some((entry) => entry.id === entryId))
  );
  state.selectedSumIds = new Set(loadSelectedSumIds(normalizedEntries));
  state.lastBulkSelectionId = normalizedEntries.some((entry) => entry.id === state.lastBulkSelectionId)
    ? state.lastBulkSelectionId
    : null;
  state.lastSumSelectionId = normalizedEntries.some((entry) => entry.id === state.lastSumSelectionId)
    ? state.lastSumSelectionId
    : null;
}

function normalizeStoredEntry(entry, fallbackIndex = 0) {
  return {
    ...DEFAULT_ENTRY,
    ...entry,
    id: entry.id || createId(),
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || new Date().toISOString(),
    sortOrder: Number.isFinite(Number(entry.sortOrder)) ? Number(entry.sortOrder) : (fallbackIndex + 1) * 1024,
  };
}

function getEntrySortOrder(entry) {
  return Number.isFinite(Number(entry.sortOrder)) ? Number(entry.sortOrder) : 0;
}

async function loadCloudEntriesForCurrentUser() {
  if (!state.user) {
    return [];
  }

  const entries = await loadUserEntries(state.user.uid);
  return entries.map((entry, index) => normalizeStoredEntry(entry, index));
}

function serializeEntryForCloud(entry) {
  return {
    id: entry.id,
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || new Date().toISOString(),
    sortOrder: getEntrySortOrder(entry),
    ...ENTRY_FIELDS.reduce((record, field) => {
      record[field] = entry[field] ?? "";
      return record;
    }, {}),
  };
}

function persistLocalEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.localEntries));
}

function setLocalEntries(entries, options = {}) {
  state.localEntries = entries.map((entry, index) => normalizeStoredEntry(entry, index));
  if (options.resetImportedIds) {
    state.importedLocalIds = new Set();
  } else {
    state.importedLocalIds = new Set(
      [...state.importedLocalIds].filter((entryId) => state.localEntries.some((entry) => entry.id === entryId))
    );
  }
  persistLocalEntries();
  persistImportedLocalIds();
}

function buildEntryFingerprint(entry) {
  return ENTRY_FIELDS.map((field) => String(entry[field] ?? "").trim()).join("||");
}

function getPendingLocalImports() {
  if (!isCloudMode()) {
    return [];
  }

  return getImportableLocalEntries(state.localEntries, state.entries, state.importedLocalIds);
}

function getImportableLocalEntries(localEntries, cloudEntries, importedLocalIds = new Set()) {
  const cloudIds = new Set(cloudEntries.map((entry) => entry.id));
  const cloudFingerprintCounts = cloudEntries.reduce((counts, entry) => {
    const fingerprint = buildEntryFingerprint(entry);
    counts.set(fingerprint, (counts.get(fingerprint) || 0) + 1);
    return counts;
  }, new Map());

  return localEntries.reduce((imports, localEntry) => {
    if (importedLocalIds.has(localEntry.id) || cloudIds.has(localEntry.id)) {
      return imports;
    }

    const fingerprint = buildEntryFingerprint(localEntry);
    const remainingCloudCount = cloudFingerprintCounts.get(fingerprint) || 0;
    if (remainingCloudCount > 0) {
      cloudFingerprintCounts.set(fingerprint, remainingCloudCount - 1);
      return imports;
    }

    imports.push(localEntry);
    return imports;
  }, []);
}

function markLocalEntriesAsImported(entries) {
  entries.forEach((entry) => {
    if (entry.id) {
      state.importedLocalIds.add(entry.id);
    }
  });

  persistImportedLocalIds();
}

function syncImportedLocalIdsWithCloud(cloudEntries) {
  const pendingWithoutMarker = getImportableLocalEntries(state.localEntries, cloudEntries, new Set());
  if (state.localEntries.length && pendingWithoutMarker.length === 0) {
    markLocalEntriesAsImported(state.localEntries);
  }
}

function buildImportedEntries(localEntries, cloudEntries) {
  let tailSortOrder = cloudEntries.length ? getEntrySortOrder(cloudEntries[cloudEntries.length - 1]) : 0;

  return localEntries.reduce((imports, localEntry) => {
    tailSortOrder += 1024;
    imports.push(
      normalizeStoredEntry(
        {
          ...localEntry,
          id: localEntry.id || createId(),
          createdAt: localEntry.createdAt || new Date().toISOString(),
          updatedAt: localEntry.updatedAt || new Date().toISOString(),
          sortOrder: tailSortOrder,
        },
        cloudEntries.length + imports.length
      )
    );

    return imports;
  }, []);
}

function parseImportedEntries(payload) {
  const sourceEntries = Array.isArray(payload) ? payload : Array.isArray(payload?.entries) ? payload.entries : [];

  return sourceEntries
    .map((entry, index) => normalizeStoredEntry(entry, index))
    .sort((firstEntry, secondEntry) => getEntrySortOrder(firstEntry) - getEntrySortOrder(secondEntry));
}

function parseImportedSelectedSumIds(payload, entries) {
  const selectedIds = Array.isArray(payload?.selectedSumIds) ? payload.selectedSumIds : entries.map((entry) => entry.id);
  const validIds = new Set(entries.map((entry) => entry.id));
  return selectedIds.filter((entryId) => validIds.has(entryId));
}

function parseImportedDisplayPreferences(payload) {
  return {
    hideZeroValues: Boolean(payload?.displayPreferences?.hideZeroValues),
    hideEmptyColumns: Boolean(payload?.displayPreferences?.hideEmptyColumns),
  };
}

function createTopSortOrder(entries) {
  if (!entries.length) {
    return 1024;
  }

  return getEntrySortOrder(entries[0]) - 1024;
}

function createBottomSortOrder(entries) {
  if (!entries.length) {
    return 1024;
  }

  return getEntrySortOrder(entries[entries.length - 1]) + 1024;
}

function getSortOrderBetween(previousEntry, nextEntry) {
  if (!previousEntry && !nextEntry) {
    return 1024;
  }

  if (!previousEntry) {
    return getEntrySortOrder(nextEntry) - 1024;
  }

  if (!nextEntry) {
    return getEntrySortOrder(previousEntry) + 1024;
  }

  const previousOrder = getEntrySortOrder(previousEntry);
  const nextOrder = getEntrySortOrder(nextEntry);

  if (nextOrder - previousOrder <= 0.0001) {
    return previousOrder + 0.5;
  }

  return (previousOrder + nextOrder) / 2;
}

async function persistCloudEntries(entries) {
  if (!isCloudMode()) {
    return;
  }

  await upsertUserEntries(state.user.uid, entries.map(serializeEntryForCloud));
}

async function handleSaveEntry(event) {
  event.preventDefault();

  if (state.isBusy) {
    return;
  }

  const entry = readFormEntry();
  if (!isEntryValid(entry)) {
    formStatus.textContent = "Complete Date, Type, Registration, and Pilot in command before saving.";
    return;
  }

  const entryIdToReveal = state.editingId;
  const beforeSnapshot = createHistorySnapshot();

  if (state.splitSourceId) {
    const splitEntry = readFormEntry(SPLIT_FIELD_PREFIX);
    if (!isEntryValid(splitEntry)) {
      formStatus.textContent =
        "Complete Date, Type, Registration, and Pilot in command in both split entries.";
      return;
    }

    await saveSplitEntries(entry, splitEntry);
    return;
  }

  state.isBusy = true;
  render();

  try {
    if (entryIdToReveal) {
      const existingEntry = state.entries.find((item) => item.id === entryIdToReveal);
      if (!existingEntry) {
        return;
      }

      const updatedEntry = normalizeStoredEntry({
        ...existingEntry,
        ...entry,
        updatedAt: new Date().toISOString(),
      });

      state.entries = state.entries.map((item) => (item.id === entryIdToReveal ? updatedEntry : item));

      if (isCloudMode()) {
        await persistCloudEntries([updatedEntry]);
      } else {
        setLocalEntries(state.entries);
      }
    } else {
      const newEntry = normalizeStoredEntry({
        id: createId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sortOrder: createTopSortOrder(state.entries),
        ...entry,
      });

      state.entries = [newEntry, ...state.entries];
      state.selectedSumIds.add(newEntry.id);

      if (isCloudMode()) {
        await persistCloudEntries([newEntry]);
      } else {
        setLocalEntries(state.entries);
      }
    }

    persistSelectedSumIds();
    resetEditorState();
    recordHistoryEntry(entryIdToReveal ? "Update entry" : "Add entry", beforeSnapshot);

    if (entryIdToReveal) {
      revealLedgerEntry(entryIdToReveal);
    }
  } catch (error) {
    console.error(error);
    applySessionSnapshot(beforeSnapshot);
    persistCurrentLocalState();
    formStatus.textContent = isCloudMode()
      ? "Cloud save failed. Please try again."
      : "This entry could not be saved right now.";
  } finally {
    state.isBusy = false;
    render();
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
    : getDefaultFormStatus();
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

  formStatus.textContent = isCloudMode()
    ? "Editing a cloud row. Save to update your private synced logbook."
    : "Editing an existing row. Save to update the ledger in place.";
  render();
  scrollEditorIntoView();
}

async function handleEntryCardAction(event) {
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
    await deleteEntry(entryId);
    return;
  }

  if (action === "toggle-sum") {
    toggleSumSelection(entryId, { range: event.shiftKey });
    return;
  }

  if (action === "move-up") {
    await moveEntry(entryId, -1);
    return;
  }

  if (action === "move-down") {
    await moveEntry(entryId, 1);
  }
}

function handleEntrySelectionChange(event) {
  const checkbox = event.target.closest("[data-bulk-select]");
  if (!checkbox) {
    return;
  }

  const useRange = checkbox.dataset.rangeSelect === "true";
  delete checkbox.dataset.rangeSelect;
  toggleBulkSelection(checkbox.value, checkbox.checked, { range: useRange });
}

function handleEntrySelectionIntent(event) {
  const checkbox = event.target.closest("[data-bulk-select]");
  if (!checkbox) {
    return;
  }

  checkbox.dataset.rangeSelect = event.shiftKey ? "true" : "false";
}

async function deleteEntry(entryId) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry || state.isBusy) {
    return;
  }

  const ok = window.confirm(
    `Delete the entry for ${formatLedgerDate(entry.date)} ${entry.type} ${entry.registration}?`
  );
  if (!ok) {
    return;
  }

  const beforeSnapshot = createHistorySnapshot();
  state.isBusy = true;
  render();

  try {
    state.entries = state.entries.filter((item) => item.id !== entryId);
    state.selectedSumIds.delete(entryId);
    state.selectedDeleteIds.delete(entryId);
    if (state.lastBulkSelectionId === entryId) {
      state.lastBulkSelectionId = null;
    }
    if (state.lastSumSelectionId === entryId) {
      state.lastSumSelectionId = null;
    }

    if (isCloudMode()) {
      await deleteUserEntry(state.user.uid, entryId);
    } else {
      setLocalEntries(state.entries);
    }

    persistSelectedSumIds();
    if (state.editingId === entryId) {
      resetEditorState({ preserveMessage: true });
    }
    recordHistoryEntry("Delete entry", beforeSnapshot);
  } catch (error) {
    console.error(error);
    applySessionSnapshot(beforeSnapshot);
    persistCurrentLocalState();
    state.syncFeedback = isCloudMode() ? "That cloud entry could not be deleted right now." : "That entry could not be deleted right now.";
  } finally {
    state.isBusy = false;
    render();
  }
}

async function handleEditorDelete() {
  if (!state.editingId) {
    return;
  }

  await deleteEntry(state.editingId);
}

async function moveEntry(entryId, direction) {
  const currentIndex = state.entries.findIndex((item) => item.id === entryId);
  const targetIndex = currentIndex + direction;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= state.entries.length || state.isBusy) {
    return;
  }

  const beforeSnapshot = createHistorySnapshot();
  const reordered = [...state.entries];
  const [entry] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, entry);
  const movedEntry = reordered[targetIndex];
  movedEntry.sortOrder = getSortOrderBetween(reordered[targetIndex - 1], reordered[targetIndex + 1]);
  state.entries = reordered;

  state.isBusy = true;
  render();

  try {
    if (isCloudMode()) {
      await persistCloudEntries([movedEntry]);
    } else {
      setLocalEntries(state.entries);
    }

    persistSelectedSumIds();
    recordHistoryEntry("Move entry", beforeSnapshot);
  } catch (error) {
    console.error(error);
    applySessionSnapshot(beforeSnapshot);
    persistCurrentLocalState();
    state.syncFeedback = isCloudMode() ? "The cloud order could not be updated right now." : "The row order could not be updated right now.";
  } finally {
    state.isBusy = false;
    render();
  }
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

async function handleDrop(event) {
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

  const beforeSnapshot = createHistorySnapshot();
  const reordered = [...state.entries];
  const [draggedEntry] = reordered.splice(fromIndex, 1);
  const insertIndex =
    fromIndex < targetIndex
      ? targetIndex + (state.dragPosition.placeAfter ? 0 : -1)
      : targetIndex + (state.dragPosition.placeAfter ? 1 : 0);

  reordered.splice(insertIndex, 0, draggedEntry);
  const movedEntry = reordered[insertIndex];
  movedEntry.sortOrder = getSortOrderBetween(reordered[insertIndex - 1], reordered[insertIndex + 1]);
  state.entries = reordered;
  clearDragMarkers();
  state.isBusy = true;
  render();

  try {
    if (isCloudMode()) {
      await persistCloudEntries([movedEntry]);
    } else {
      setLocalEntries(state.entries);
    }

    persistSelectedSumIds();
    recordHistoryEntry("Reorder entries", beforeSnapshot);
  } catch (error) {
    console.error(error);
    applySessionSnapshot(beforeSnapshot);
    persistCurrentLocalState();
    state.syncFeedback = isCloudMode() ? "The cloud row order could not be updated right now." : "The row order could not be updated right now.";
  } finally {
    state.isBusy = false;
    render();
  }
}

function handleSumConsoleAction(event) {
  const button = event.target.closest("[data-sum-action]");
  if (!button) {
    return;
  }

  const beforeSnapshot = createHistorySnapshot();
  const action = button.dataset.sumAction;
  if (action === "select-all") {
    state.selectedSumIds = new Set(state.entries.map((entry) => entry.id));
    state.lastSumSelectionId = state.entries.length ? state.entries[state.entries.length - 1].id : null;
  }

  if (action === "clear") {
    state.selectedSumIds = new Set();
    state.lastSumSelectionId = null;
  }

  persistSelectedSumIds();
  render();
  recordHistoryEntry(action === "select-all" ? "Select all rows for manual sum" : "Clear manual sum selection", beforeSnapshot);
}

async function handleBulkConsoleAction(event) {
  const button = event.target.closest("[data-bulk-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.bulkAction;

  if (action === "select-all") {
    const beforeSnapshot = createHistorySnapshot();
    state.selectedDeleteIds = new Set(state.entries.map((entry) => entry.id));
    state.lastBulkSelectionId = state.entries.length ? state.entries[state.entries.length - 1].id : null;
    render();
    recordHistoryEntry("Select all rows for delete", beforeSnapshot);
    return;
  }

  if (action === "clear") {
    const beforeSnapshot = createHistorySnapshot();
    state.selectedDeleteIds = new Set();
    state.lastBulkSelectionId = null;
    render();
    recordHistoryEntry("Clear bulk delete selection", beforeSnapshot);
    return;
  }

  if (action === "delete-selected") {
    await deleteSelectedEntries();
    return;
  }

  if (action === "delete-all") {
    await deleteAllEntries();
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
  const beforeSnapshot = createHistorySnapshot();
  state.hideZeroValues = hideZeroValuesToggle.checked;
  state.hideEmptyColumns = hideEmptyColumnsToggle.checked;
  persistDisplayPreferences();
  render();
  recordHistoryEntry("Update ledger display preferences", beforeSnapshot);
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
    isCloudMode()
      ? "Split mode is active. Edit both cloud rows and save them back into the original position."
      : "Split mode is active. Edit both entries and save them back into the original row position.";
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
    ? isCloudMode()
      ? "Editing a cloud row. Save to update your private synced logbook."
      : "Editing an existing row. Save to update the ledger in place."
    : getDefaultFormStatus();
  render();
}

async function deleteSelectedEntries() {
  const selectedEntries = state.entries.filter((entry) => state.selectedDeleteIds.has(entry.id));
  if (!selectedEntries.length || state.isBusy) {
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
  const beforeSnapshot = createHistorySnapshot();
  state.isBusy = true;
  render();

  try {
    state.entries = state.entries.filter((entry) => !selectedIds.has(entry.id));
    state.selectedDeleteIds = new Set();
    state.selectedSumIds = new Set(
      [...state.selectedSumIds].filter((entryId) => !selectedIds.has(entryId))
    );
    if (state.lastBulkSelectionId && selectedIds.has(state.lastBulkSelectionId)) {
      state.lastBulkSelectionId = null;
    }
    if (state.lastSumSelectionId && selectedIds.has(state.lastSumSelectionId)) {
      state.lastSumSelectionId = null;
    }

    if (isCloudMode()) {
      await deleteUserEntries(state.user.uid, [...selectedIds]);
    } else {
      setLocalEntries(state.entries);
    }

    persistSelectedSumIds();
    if (state.editingId && selectedIds.has(state.editingId)) {
      resetEditorState();
    }
    recordHistoryEntry(`Delete ${selectedEntries.length} entr${selectedEntries.length === 1 ? "y" : "ies"}`, beforeSnapshot);
  } catch (error) {
    console.error(error);
    applySessionSnapshot(beforeSnapshot);
    persistCurrentLocalState();
    state.syncFeedback = isCloudMode() ? "Selected cloud entries could not be deleted right now." : "Selected entries could not be deleted right now.";
  } finally {
    state.isBusy = false;
    render();
  }
}

async function deleteAllEntries() {
  if (!state.entries.length || state.isBusy) {
    return;
  }

  if (!window.confirm(`Delete all ${state.entries.length} saved entries?`)) {
    return;
  }

  const beforeSnapshot = createHistorySnapshot();
  state.isBusy = true;
  render();

  try {
    const entryIds = state.entries.map((entry) => entry.id);
    state.entries = [];
    state.selectedDeleteIds = new Set();
    state.selectedSumIds = new Set();
    state.lastBulkSelectionId = null;
    state.lastSumSelectionId = null;

    if (isCloudMode()) {
      await deleteUserEntries(state.user.uid, entryIds);
    } else {
      setLocalEntries([]);
    }

    persistSelectedSumIds();
    resetEditorState();
    recordHistoryEntry("Delete all entries", beforeSnapshot);
  } catch (error) {
    console.error(error);
    applySessionSnapshot(beforeSnapshot);
    persistCurrentLocalState();
    state.syncFeedback = isCloudMode() ? "Cloud entries could not be fully cleared right now." : "Entries could not be fully cleared right now.";
  } finally {
    state.isBusy = false;
    render();
  }
}

async function saveSplitEntries(primaryEntry, secondaryEntry) {
  const sourceIndex = state.entries.findIndex((item) => item.id === state.splitSourceId);
  const sourceEntry = state.entries[sourceIndex];
  if (sourceIndex < 0 || !sourceEntry) {
    return;
  }

  const beforeSnapshot = createHistorySnapshot();
  const timestamp = new Date().toISOString();
  const secondEntryId = createId();
  const shouldCarrySum = state.selectedSumIds.has(sourceEntry.id);
  const shouldCarryBulk = state.selectedDeleteIds.has(sourceEntry.id);
  const firstEntry = normalizeStoredEntry({
    ...sourceEntry,
    ...primaryEntry,
    updatedAt: timestamp,
  });
  const secondEntry = normalizeStoredEntry({
    ...sourceEntry,
    ...secondaryEntry,
    id: secondEntryId,
    createdAt: timestamp,
    updatedAt: timestamp,
    sortOrder: getSortOrderBetween(firstEntry, state.entries[sourceIndex + 1]),
  });

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

  state.isBusy = true;
  render();

  try {
    if (isCloudMode()) {
      await persistCloudEntries([firstEntry, secondEntry]);
    } else {
      setLocalEntries(state.entries);
    }

    persistSelectedSumIds();
    resetEditorState();
    recordHistoryEntry("Split entry", beforeSnapshot);
    revealLedgerEntry(firstEntry.id);
  } catch (error) {
    console.error(error);
    applySessionSnapshot(beforeSnapshot);
    persistCurrentLocalState();
    state.syncFeedback = isCloudMode() ? "The cloud split could not be saved right now." : "The split could not be saved right now.";
  } finally {
    state.isBusy = false;
    render();
  }
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
  renderSyncConsole();
  renderHistoryConsole();
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
  const totalHours = state.entries.reduce((sum, entry) => sum + sumHeadlineFlightTime(entry), 0);
  const totalLandings = state.entries.reduce(
    (sum, entry) => sum + toNumber(entry.landingsDay) + toNumber(entry.landingsNight),
    0
  );
  const totals = state.entries.reduce(
    (summary, entry) => {
      summary.ifActual += toNumber(entry.instrumentActual);
      summary.fstd += toNumber(entry.instrumentFstd);
      summary.seDual += toNumber(entry.seDayDual) + toNumber(entry.seNightDual);
      summary.picDay += toNumber(entry.seDayPic) + toNumber(entry.meDayPic);
      summary.picNight += toNumber(entry.seNightPic) + toNumber(entry.meNightPic);
      summary.meDual += toNumber(entry.meDayDual) + toNumber(entry.meNightDual);
      return summary;
    },
    {
      ifActual: 0,
      fstd: 0,
      seDual: 0,
      picDay: 0,
      picNight: 0,
      meDual: 0,
    }
  );

  entryCount.textContent = String(state.entries.length);
  flightHours.textContent = formatTotal(totalHours);
  landingCount.textContent = String(totalLandings);
  summaryIfActual.textContent = formatTotal(totals.ifActual);
  summaryFstd.textContent = formatTotal(totals.fstd);
  summarySeDual.textContent = formatTotal(totals.seDual);
  summaryPicDay.textContent = formatTotal(totals.picDay);
  summaryPicNight.textContent = formatTotal(totals.picNight);
  summaryMeDual.textContent = formatTotal(totals.meDual);
}

function createSyncInitials(source, fallback = "GU") {
  const cleanedSource = String(source || "").trim();
  if (!cleanedSource) {
    return fallback;
  }

  const normalizedSource = cleanedSource.includes("@") ? cleanedSource.split("@")[0] : cleanedSource;
  const words = normalizedSource
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return fallback;
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function renderSyncConsole() {
  const hasDeviceEntries = state.localEntries.length > 0;
  const isSignedIn = Boolean(state.user);
  const pendingLocalImports = getPendingLocalImports();
  const deviceEntryCount = state.localEntries.length;
  const cloudEntryCount = isCloudMode() ? state.entries.length : 0;
  const pendingEntryCount = isCloudMode() ? pendingLocalImports.length : deviceEntryCount;
  const displayName = state.user?.displayName || state.user?.email?.split("@")[0] || "Google user";
  let importLocalButtonLabel = "Import device data to cloud";
  let badgeText = "guest mode";
  let badgeClassName = "sync-badge sync-badge--guest";
  let accountName = "Guest mode";
  let accountMeta = hasDeviceEntries ? "Saved on this browser only" : "Ready for first entry";
  let syncSummaryText = "Start logging on this device. Sign in when you want cloud sync.";
  let summaryClassName = "sync-console__summary sync-console__summary--note";

  if (!hasDeviceEntries) {
    importLocalButtonLabel = "No device entries to import";
  } else if (!isCloudMode()) {
    importLocalButtonLabel = isSignedIn
      ? "Cloud sync unavailable right now"
      : "Sign in to import device data";
  } else if (!pendingLocalImports.length) {
    importLocalButtonLabel = "Device data already in cloud";
  } else {
    importLocalButtonLabel = `Import ${pendingLocalImports.length} device entr${pendingLocalImports.length === 1 ? "y" : "ies"} to cloud`;
  }

  if (!state.authResolved) {
    badgeText = "checking";
    badgeClassName = "sync-badge sync-badge--checking";
    accountName = "Checking account";
    accountMeta = "Resolving sign-in and sync status";
    syncSummaryText = "Checking whether this logbook should stay in guest mode or connect to cloud sync.";
  } else if (isCloudMode()) {
    badgeText = "cloud active";
    badgeClassName = "sync-badge";
    accountName = displayName;
    accountMeta = "Signed in • syncing";
    syncSummaryText = pendingLocalImports.length
      ? `${pendingLocalImports.length} guest entr${pendingLocalImports.length === 1 ? "y" : "ies"} on this device ${
          pendingLocalImports.length === 1 ? "is" : "are"
        } not yet synced to cloud. Import to keep your logbook complete.`
      : "This device copy is already fully represented in cloud.";
    if (!pendingLocalImports.length) {
      summaryClassName += " sync-console__summary--calm";
    }
  } else if (isSignedIn) {
    badgeText = "device mode";
    badgeClassName = "sync-badge sync-badge--fallback";
    accountName = displayName;
    accountMeta = "Signed in • using device copy";
    syncSummaryText = "Your Google account is connected, but cloud data is temporarily unavailable. You can keep working on the device copy.";
  } else if (hasDeviceEntries) {
    syncSummaryText = `${deviceEntryCount} guest entr${deviceEntryCount === 1 ? "y is" : "ies are"} saved on this device only. Sign in when you want cloud sync.`;
  }

  storageModeValue.textContent = isCloudMode()
    ? "Private cloud sync"
    : isSignedIn
      ? "Signed in · using device copy"
      : "Local browser vault";
  syncBadge.className = badgeClassName;
  syncBadge.textContent = badgeText;
  syncAvatar.textContent = createSyncInitials(isSignedIn ? displayName || state.user?.email : "Guest user");
  syncAvatar.classList.toggle("sync-avatar--guest", !isSignedIn);
  authStatus.textContent = accountName;
  syncMessage.textContent = accountMeta;
  syncCloudCount.textContent = String(cloudEntryCount);
  syncPendingCount.textContent = String(pendingEntryCount);
  syncCloudStat.classList.toggle("is-empty", cloudEntryCount === 0);
  syncPendingStat.classList.toggle("is-empty", pendingEntryCount === 0);
  syncSummary.className = summaryClassName;
  syncSummary.textContent = syncSummaryText;
  syncFeedback.hidden = !state.syncFeedback;
  syncFeedback.textContent = state.syncFeedback;

  signInButton.hidden = isSignedIn;
  signOutButton.hidden = !isSignedIn;
  signInButton.disabled = state.isBusy || !state.authResolved;
  signOutButton.disabled = state.isBusy || !state.authResolved;
  exportDataButton.disabled = state.isBusy || state.entries.length === 0;
  importFileButton.disabled = state.isBusy;
  importLocalButton.disabled = state.isBusy || !isCloudMode() || !hasDeviceEntries || pendingLocalImports.length === 0;
  importLocalButton.textContent = importLocalButtonLabel;
}

function renderManifest() {
  emptyState.hidden = state.entries.length > 0;
  manifestStatus.textContent = isCloudMode()
    ? "Cloud rows are private to the signed-in pilot account. Drag cards to reorder the synced ledger."
    : state.user
      ? "Cloud data is unavailable right now, so you are viewing the device copy."
      : "Drag cards to reorder the printed ledger rows on this device.";
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
    bulkStatus.textContent = "Select one or more entries to delete them together. Shift-click checkboxes to grab a range.";
  } else if (selectedRows === totalRows) {
    bulkStatus.textContent = `All ${totalRows} entries are selected for bulk delete.`;
  } else {
    bulkStatus.textContent = `${selectedRows} of ${totalRows} entries selected for bulk delete. Shift-click to extend the range faster.`;
  }

  deleteSelectedButton.textContent = selectedRows
    ? `Delete selected (${selectedRows})`
    : "Delete selected";
  deleteSelectedButton.disabled = selectedRows === 0 || state.isBusy;
  deleteAllButton.disabled = totalRows === 0 || state.isBusy;
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
    sumStatus.textContent = "No rows are selected for the manual sum right now. Shift-click rows or sum buttons to grab a range.";
    return;
  }

  sumStatus.textContent = `Manual sum is using ${selectedRows} of ${totalRows} saved rows. Shift-click to extend the range faster.`;
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
  } else if (isEditMode) {
    formTitle.textContent = "Edit flight entry";
    saveButton.textContent = "Update entry";
  } else {
    formTitle.textContent = "Add a flight entry";
    saveButton.textContent = "Save entry";
  }

  saveButton.disabled = state.isBusy;
  splitEntryButton.disabled = state.isBusy;
  cancelSplitButton.disabled = state.isBusy;
  deleteEntryButton.disabled = state.isBusy;
  resetFormButton.disabled = state.isBusy;
  printButton.disabled = state.isBusy;
}

function renderLedgerMode() {
  if (!ledgerModeToggle || !ledgerModeStatus) {
    return;
  }

  const isSelectMode = state.ledgerInteractionMode === "select";
  ledgerModeStatus.textContent = isSelectMode
    ? "Select mode is on. Click filled ledger rows to add or remove them from the manual subtotal. Shift-click to select a range."
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

function sumHeadlineFlightTime(entry) {
  return (
    toNumber(entry.seDayDual) +
    toNumber(entry.seDayPic) +
    toNumber(entry.seNightDual) +
    toNumber(entry.seNightPic) +
    toNumber(entry.meDayDual) +
    toNumber(entry.meNightDual) +
    toNumber(entry.meNightPic)
  );
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

function loadImportedLocalIds(entries) {
  try {
    const raw = localStorage.getItem(IMPORTED_LOCAL_IDS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const entryIds = new Set(entries.map((entry) => entry.id));
    return parsed.filter((entryId) => entryIds.has(entryId));
  } catch (error) {
    return [];
  }
}

function persistImportedLocalIds() {
  const validIds = new Set(state.localEntries.map((entry) => entry.id));
  const orderedImportedIds = [...state.importedLocalIds].filter((entryId) => validIds.has(entryId));
  localStorage.setItem(IMPORTED_LOCAL_IDS_KEY, JSON.stringify(orderedImportedIds));
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
  if (state.isBusy) {
    return;
  }

  const beforeSnapshot = createHistorySnapshot();
  const ledgerView = options.preserveLedgerView ? captureLedgerView() : null;
  const shouldSelect =
    typeof forceState === "boolean" ? forceState : !state.selectedDeleteIds.has(entryId);
  const targetIds = options.range ? getEntryRangeIds(state.lastBulkSelectionId, entryId) : [entryId];
  targetIds.forEach((targetId) => {
    if (shouldSelect) {
      state.selectedDeleteIds.add(targetId);
    } else {
      state.selectedDeleteIds.delete(targetId);
    }
  });
  state.lastBulkSelectionId = entryId;

  render();
  recordHistoryEntry("Update delete selection", beforeSnapshot);

  if (ledgerView) {
    restoreLedgerView(ledgerView);
  }
}

function toggleSumSelection(entryId, options = {}) {
  if (state.isBusy) {
    return;
  }

  const beforeSnapshot = createHistorySnapshot();
  const ledgerView = options.preserveLedgerView ? captureLedgerView() : null;
  const shouldSelect =
    typeof options.forceState === "boolean" ? options.forceState : !state.selectedSumIds.has(entryId);
  const targetIds = options.range ? getEntryRangeIds(state.lastSumSelectionId, entryId) : [entryId];
  targetIds.forEach((targetId) => {
    if (shouldSelect) {
      state.selectedSumIds.add(targetId);
    } else {
      state.selectedSumIds.delete(targetId);
    }
  });
  state.lastSumSelectionId = entryId;

  persistSelectedSumIds();
  render();
  recordHistoryEntry("Update manual sum selection", beforeSnapshot);

  if (ledgerView) {
    restoreLedgerView(ledgerView);
  }
}

function getEntryRangeIds(anchorId, targetId) {
  const targetIndex = state.entries.findIndex((entry) => entry.id === targetId);
  const anchorIndex = state.entries.findIndex((entry) => entry.id === anchorId);

  if (targetIndex < 0 || anchorIndex < 0) {
    return [targetId];
  }

  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);
  return state.entries.slice(start, end + 1).map((entry) => entry.id);
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
