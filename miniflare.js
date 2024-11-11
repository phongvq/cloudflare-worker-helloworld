import { Miniflare } from "miniflare";

const mf = new Miniflare({
  modules: true,
  scriptPath: 'src/index.ts',
});

const res = await mf.dispatchFetch("http://localhost:8787/");
console.log(await res.text()); // Hello Miniflare!
await mf.dispose();
