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
