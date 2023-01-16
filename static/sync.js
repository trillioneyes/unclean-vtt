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
