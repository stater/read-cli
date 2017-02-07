let config = require('./index.json');
let { parse, byOpt, byEnv } = require('./../dist/main.js');

let { env, arg } = parse(config);

try {
  if (arg.port !== 8080 || arg.host !== '127.0.0.1' || arg.command !== 'build' || arg.build !== 'script' || !arg.verbose) {
    throw new Error('[cli => parse] Parse failed!');
  } else {
    console.log(' - [cli => parse] Success!');
  }

  let opt = byEnv({
    default: { title: 'Development Title', length: 10 },
    production: { title: 'Production Title' }
  });

  if (opt.title !== 'Production Title' || opt.length !== 10) {
    throw new Error('[env => production] Parse failed!');
  } else {
    console.log(' - [env => production] Success!');
  }

  opt = byOpt(['typescript', 'NODE_SRC_TYPE'], {
    default: { main: 'main.js' },
    typescript: { main: 'main.ts' }
  });

  if (opt.main !== 'main.ts') {
    throw new Error('[opt => typescript] Parse failed!');
  } else {
    console.log(' - [opt => typscript] Success!');
  }

  let p = parse(Object.assign(config, { protect: true }));

  if (!p.arg.error) {
    throw new Error('[protect => true] Parse failed!');
  } else {
    console.log(' - [protect => true] Success!');
  }

  try {
    parse(Object.assign(config, { protect: 'throw' }));

    throw new Error('[protect => throw] Parse failed!');
  } catch (err) {
    console.log(' - [protect => throw] Success!');
  }

  console.log('\r\nTest success!');
} catch (err) {
  throw err;
}
