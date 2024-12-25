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

const table = document.getElementById('table')
table.addEventListener('click', (event) => {
  if (event.target.classList.contains('delete')) {
    const result = window.confirm('Confirm to delete this status?')
    if (result) {
      fetchUp({
        url: `/status/${event.target.dataset.id}`,
        method: 'DELETE',
      })
        .then(() => {
          location.reload()
        })
    }
  }
  // else if (event.target.classList.contains('edit')) {
  //   const text = window.prompt('please input new text', event.target.parentNode.previousElementSibling.textContent)
  //   if (typeof text === 'string' && text.trim().length > 0) {
  //     fetchUp({
  //       url: `/status/${event.target.dataset.id}`,
  //       method: 'PATCH',
  //       data: {
  //         text,
  //       },
  //     })
  //       .then(() => {
  //         location.reload()
  //       })
  //   }
  // }
})
