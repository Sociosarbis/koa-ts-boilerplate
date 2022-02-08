const SIZE_PER_SLICE = 1000000

function chunks(arr, size) {
  let ret = []
  for (let i = 0; i < arr.size; i += size) {
    ret.push(arr.slice(i, i + size))
  }
  return ret
}

function myFetch(url, opts = {}, onProgress) {
  return new Promise((res, rej) => {
    var xhr = new XMLHttpRequest()
    xhr.open(opts.method || 'get', url)
    for (var k in opts.headers || {}) xhr.setRequestHeader(k, opts.headers[k])
    xhr.onload = (e) => res(JSON.parse(e.target.responseText))
    xhr.onerror = rej
    if (xhr.upload && onProgress) xhr.upload.onprogress = onProgress
    xhr.send(opts.body)
  })
}

window.sliceUpload = async function sliceUpload(file) {
  let slices = chunks(file, SIZE_PER_SLICE)

  let buffers = await Promise.all(slices.map((chunk) => chunk.arrayBuffer()))

  var worker = new Worker('/static/js/md5Worker.js', {
    type: 'module',
  })

  worker.postMessage(buffers, buffers)

  let { name, data } = await new Promise((res) => {
    worker.onmessage = (e) => {
      res(e.data)
    }
  })

  const {
    data: { progress },
  } = await myFetch(`/uploads/${name}/progress`)

  data = data.filter((item, i) => {
    return !(i in progress) && progress[i] !== item.byteLength
  })

  slices = data.map((item, i) => ({
    name: `${name}_${i}`,
    data: new Blob([item]),
  }))

  await Promise.all(
    slices.map((s) => {
      const form = new FormData()
      form.append('name', s.name)
      form.append('data', s.data)
      return myFetch(
        '/uploadSlice',
        {
          method: 'PUT',
          body: form,
        },
        (e) => {
          console.log(e)
        },
      )
    }),
  )

  const form = new FormData()
  form.append('name', file.name)
  form.append('hash', name)
  await myFetch(
    '/mergeFile',
    {
      method: 'POST',
      body: form,
    },
    (e) => {
      console.log(e)
    },
  )
}

export default sliceUpload
