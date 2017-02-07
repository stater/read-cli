# ReadCLI

A small NodeJS module to help parsing the CLI command and options.

**Example**

```bash
./main build script --verbose --production --port 3309 host=localhost
```

Parsing the CLI command above will resulting:

```json
{
  "env": "production",
  "arg" :{
    "command": "build",
    "build": "script",
    "verbose": true,
    "production": "true"
  }
}
```

***

## Instalation

Simply add the `read-cli` as dependencies and load it from your script.

```bash
npm install --save read-cli
```

**Example**

`#1`

```bash
node main.js build script
```

`#2`

```bash
node main.js build script --host prod.localhost --port 8080 --verbose --production
```

`#3`

```bash
NODE_ENV=staging node main.js publish --host stag.localhost --port 9090 --verbose
```

`main.js`

```js
import { parse } from 'read-cli';

const {env, arg: {command, build, host, port, verbose}} = parse({
  configs: {
    build: null,
    '--host': 'localhost',
    '--port': 3000
  }
});

// RESULT #1:
// env => 'development'
// command => 'build'
// build => 'script'
// host => 'localhost;
// port => 8080
// verbose => undefined

// RESULT #2:
// env => 'production'
// command => 'build'
// build => 'script'
// host => 'prod.localhost;
// port => 8080
// verbose => true

// RESULT #3:
// env => 'staging'
// command => 'publish'
// build => null
// host => 'stag.localhost;
// port => 9090
// verbose => true
```

***

## Usage

### parse(*optional* `config{}`);

Use it to parse the CLI command and options. Add **`config{}`** to configure the parser.

```js
import {parse} from 'read-cli';

const {env, arg} = parse();
```

For the `env` it using `development`, `staging`, and `production` pattern. E.g: adding `--production` to the CLI will set the `env` to `production`. If none of the pattern given on the CLI command or `NODE_ENV` then `development` will be used.

The parser will use the first `process.argv` (without node and file) as the command, and parse the configs and options based on the parser config (if given).

**Configs**

*   **`options[]`** - Array to register CLI options (only key and be true if given). Useful for protecting the options usage.
*   **`configs{}`** - Object to register the CLI configs (has key and value), also giving default value if not defined on the CLI configs.
*   **`remdash!?`** - Boolean does the parser should remove the `--` or `-` from the begining of keys. By default it'll be always removed, so use `remdash: false` to keep them.
*   **`protect??`** - Prevent from using unknown command, configs, and options. Use `true` to add the error object to the `arg`, or use `throw` to throw the error directly.

**Example**

```bash
node main.js build script --host localhost --port 8080 --verbose --production
```

```js
import {parse} from 'read-cli';

const {env, arg} = parse({
  configs: {
    '--host': '127.0.0.1',
    '--port': 3000
  }
});

// RESULT:
// env => production
// arg => { command: 'build', build: 'script', host: 'localhost', port: 8080, verose: true }
```

From the sample above, if we don't map the configs (using `configs: {}`) anything will be parsed as options, so the value is `true`, even the `localhost` and `8080` will be parsed as option. E.g: `{ host: true, port: true, localhost: true, 8080: true }`.



```bash
node main.js build script --verbose --production --foo
```

```js
import {parse} from 'read-cli';

const {env, arg} = parse({
  options: ['--verbose', '--production', '--staging'],
  configs: {
    build: null
  },
  protect: true
});

// RESULT:
// arg => { error: Error }
```

From the sample above, the parser will mark it as error since the configs is protected and the CLI giving unknown option `--foo` that not registered on the parser configs. The parser will add `error` to the `arg` object so you can use that to log the error.

```bash
node main.js build script --foo --bar --verbose --production
```

```js
import {parse} from 'read-cli';

const {env, arg} = parse({
  options: ['--verbose', '--production', '--staging'],
  configs: {
    build: null
  },
  protect: 'throw'
});
```

```
Error: Unknow parameter: build script ![--foo]=true ![--bar] --verbose --production.
    at parse ...
```

From the sample above, the parser will throw the error directly since the option `--foo` is not registered and the `protect` setting is `throw`.

### byEnv(*required*  `object{}`);

Merge the object depend on the `env`. This helper requires `parse()` has been called.

**Example**

```bash
node main.js build --production
```

```bash
NODE_EVN=production node main.js build
```

```js
import {parse, byEnv} from 'read-cli';

// Initialize the parser.
parse();

let settings = byEnv({
  default: {
    host: 'localhost',
    port: 8080
  },
  staging: {
    host: 'staging.localhost'
  },
  production: {
    host: 'production.localhost'
  }
});

// RESULT:
// { host: 'production.localhost', port: 8080 }
```

From the sample above, we change the default settings (`auto`) that depend on the `env`. Since we give `--production` or using `NODE_ENV=production` on the CLI (parser set `env` as `production`), then the `host` changed to `production.localhost`.

### byOpt(*required* `object{}`);

Merge the object depend on the CLI ENV or options. Thisl helper requires `parse()` has been called.

**Example**

```bash
node main.js build --typescript
```

```bash
NODE_SRC_TYPE=typescript node main.js build
```

```js
import {parse, byOpt} from 'read-cli';

// Initialize the parser.
parse();

let inputs = byOpt(['typescript', 'NODE_SRC_TYPE'], {
  default: { file: 'index.js' },
  typescript: { file: 'index.ts' }
});

// RESULT:
// { main: 'index.ts' }
```

From the sample above, the `inputs.main` is overriden by `typescript` option since it was given on the CLI option or ENV variable.

***

## More Example

```bash
NODE_EVN=production node main.js build script --port 8080 --verbose --typescript
```

```js
import { parse, byEnv, byOpt } from 'read-cli';

const handlers = {
  build: {
    script(settings) {
      const { host, port, main: { file } } = settings;

      console.log(settings);

      // host => 'prod.localhost'
      console.log(host);
      // port => 8080
      console.log(port);
      // file => 'main.ts'
      console.log(file);
    }
  }
}

let configs = {
  build: null,
  '--host': 'localhost',
  '--port': 3000
}

let { arg: { command, build, host, port, verbose } } = parse({ configs });

if (verbose) {
  console.log(`Starting to ${command} the ${build}...`);
}

if (handlers[command] && handlers[command][build]) {
  handlers[command][build](byEnv({
    default: {
      host,
      port,
      main: byOpt(['typescript', 'NODE_SRC_TYPE'], {
        default: { file: 'main.js' },
        typescript: { file: 'main.ts' }
      })
    },
    production: {
      host: 'prod.localhost'
    }
  }));
}
```

***

## Changelog

#### **`v1.0.0`** - Feb 7, 2017

*   Initial release.

***

## The MIT License **`(MIT)`**

Copyright © 2017 Nanang Mahdaen El Agung

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


