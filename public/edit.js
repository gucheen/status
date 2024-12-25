async function fetchUp({
  url = '',
  data = {},
  method = 'POST'
}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: method, // *GET, POST, PUT, DELETE, etc.
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

function showError(errorMessage) {
  const errorMsg = document.createElement('div')
  errorMsg.classList.add('error-msg')
  errorMsg.textContent = errorMessage
  const currentErrorMsg = document.querySelector('.error-msg')
  if (currentErrorMsg) {
    currentErrorMsg.replaceWith(errorMsg)
  } else {
    document.querySelector('.main').prepend(errorMsg)
  }
}

const form = document.getElementById('form')
form.addEventListener('submit', (event) => {
  event.preventDefault()
  const data = new FormData(event.target)
  const text = data.get('text')
  if (typeof text !== 'string' || text.trim().length === 0) {
    showError('Please input status text')
    return
  }
  const id = location.pathname.split('/')[2]
  fetchUp({
    url: `/status/${id}`,
    data: Object.fromEntries(data),
    method: 'PATCH',
  })
    .then(res => {
      if (res) {
        if (res.message) {
          showError(res.message)
        } else if (res.success) {
          location.href = '/manage'
        }
      }
    })
  return false
})
