function getNewId() {
  return Utilities.getUuid();
}

function persistToken(sheetId, tokenProperties) {
  const sheet = getTabletopSheet(sheetId);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  // logic goes here
  const tokens = getTokenTable(sheet);
  // Find existing row, if any
  const idColumn = tokens.offset(0, 1, tokens.getHeight(), 1);
  const idCell = idColumn.createTextFinder(tokenProperties.id).matchEntireCell(true).findNext();
  let targetRow;
  if (!idCell) {
    sheet.insertRowAfter(tokens.getLastRow());
    targetRow = sheet.getRange(tokens.getLastRow() + 1, 1, 1, 5);
  } else {
    targetRow = sheet.getRange(idCell.getRow(), 1, 1, 5);
  }
  targetRow.setValues([["Tokens", tokenProperties.id, tokenProperties.name, tokenProperties.pX, tokenProperties.pY]]);
  lock.releaseLock();
}

function loadTokens(sheetId) {
  const sheet = getTabletopSheet(sheetId);
  const tokens = getTokenTable(sheet).getValues();
  const keys = tokens[0].slice(1);
  return tokens.slice(1).map(
    (token) => {
      let properties = {};
      for (const index of keys.keys()) {
        properties[keys[index]] = token[index + 1];
      }
      return properties;
    }
  );
}