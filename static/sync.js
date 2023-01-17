async function tokenPost(tokenData) {
    return fetch('./api/tokens', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenData)
    });
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
