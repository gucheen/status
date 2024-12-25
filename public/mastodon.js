async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match 'Content-Type' header
  })
  if (response.redirected) {
    window.location.href = response.url
  }
  return response.json() // parses JSON response into native JavaScript objects
}

const search = new URLSearchParams(location.search)
if (search.has('code')) {
  const code = search.get('code')
  postData('/mastodon/auth', {
    code,
  })
    .then((result) => {
      if (result && result.success) {
        location.href = '/mastodon'
      }
    })
}
