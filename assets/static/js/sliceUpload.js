const SIZE_PER_SLICE = 1000000;

function chunks(arr, size) {
  let ret = [];
  for (let i = 0; i < arr.size; i += size) {
    ret.push(arr.slice(i, i + size));
  }
  return ret;
}

function myFetch(url, opts = {}, onProgress) {
  return new Promise((res, rej) => {
    var xhr = new XMLHttpRequest();
    xhr.open(opts.method || 'get', url);
    for (var k in opts.headers || {}) xhr.setRequestHeader(k, opts.headers[k]);
    xhr.onload = (e) => res(e.target.responseText);
    xhr.onerror = rej;
    if (xhr.upload && onProgress) xhr.upload.onprogress = onProgress;
    xhr.send(opts.body);
  });
}

function sliceUpload(file) {
  const name = file.name;
  const slices = chunks(file, SIZE_PER_SLICE).map((item, i) => ({
    name: `${name}_${i}`,
    data: item,
  }));
  const uploadTasks = Promise.all(
    slices.map((s) => {
      const form = new FormData();
      form.append('name', s.name);
      form.append('data', s.data);
      return myFetch(
        '/uploadSlice',
        {
          method: 'PUT',
          body: form,
        },
        (e) => {
          console.log(e);
        },
      );
    }),
  );
  console.log(uploadTasks);
}
