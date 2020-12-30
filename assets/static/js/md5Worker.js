import init, { JsMd5 } from '/static/js/md5/md5.js';

let setOk = null;
let ready = new Promise((res) => {
  setOk = res;
});

async function main() {
  await init();
  setOk(JsMd5);
}

main();

onmessage = (e) => {
  ready.then(async (JsMd5) => {
    const md5 = JsMd5.new();
    for (let item of e.data) {
      md5.update_u8(new Uint8Array(await item.arrayBuffer()));
    }
    postMessage(md5.finish());
    md5.free();
  });
};

onerror = (e) => {
  postMessage(e);
};
