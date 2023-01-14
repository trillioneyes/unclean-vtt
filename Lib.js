// Spreadsheet
function getDatabaseSpreadsheet() {
  let databaseSpreadsheet;
  if (!ScriptProperties.getProperty("database-spreadsheet-id")) {
    databaseSpreadsheet = SpreadsheetApp.create("Unclean VTT Database");
    ScriptProperties.setProperty("database-spreadsheet-id", databaseSpreadsheet.getId());
  } else {
    databaseSpreadsheet = SpreadsheetApp.openById(ScriptProperties.getProperty("database-spreadsheet-id"));
  }
  return databaseSpreadsheet;
}

// Sheet
function getTabletopSheet(sheetId) {
  return getDatabaseSpreadsheet().getSheets()[sheetId];
}

// Range
function getTokenTable(sheet) {
  const firstColumn = sheet.getRange('A:A');
  const startRow = firstColumn.createTextFinder('Tokens')
    .matchEntireCell(true)
    .findNext()
    .getRow();
  const endRow = firstColumn.createTextFinder('Properties')
    .matchEntireCell(true)
    .findNext()
    .getRow();
  const columnRange = sheet.getRange(startRow, 1, endRow - startRow);
  return columnRange.getDataRegion(SpreadsheetApp.Dimension.COLUMNS);
}
