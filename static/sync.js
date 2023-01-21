async function tokenPost(tokenData) {
  const response = await fetch('./api/tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tokenData)
  });
  const json = await response.json();
  for (const id of Object.keys(json)) {
    tokenFromProperties(json[id]);
  }
}

async function tokenPostPromote(tokenData) {
  const response = await fetch('./api/tokens/promote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tokenData)
  });
  const json = await response.json();
  for (const id of Object.keys(json)) {
    tokenFromProperties(json[id]);
  }
}

async function tokenGetCommitted(id) {
  const response = await fetch('./api/tokens/revert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({token: id})
  });
  const json = await response.json();
  return json;
}

async function tokensGet() {
  return fetch('./api/tokens')
    .then((response) => response.json());
}

async function tokensDelete(ids) {
  return fetch('./api/tokens', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ids: ids})
  });
}

async function syncDirtyTokens() {
  const dirtyTokens = Array.from(
    document.querySelectorAll('[is=unclean-token][data-dirty=true][id]')
  );
  for (const token of dirtyTokens) {
    token.setAttribute('data-dirty', false);
  }
  if (dirtyTokens.length) {
    tokenPost(dirtyTokens.map(tokenToProperties));
  }
}
