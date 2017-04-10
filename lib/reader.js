import { setCfg } from './helper';

let color;

try {
  // Trying to use cli-color if available on the user's project.
  color = require('cli-color');
} catch (err) {
  // Create fake color if cli-color unavailable.
  color = {
    redBright: (text) => text,
    yellow: (text) => text
  }
}

export function parse({ configs = {}, options = [], protect, remdash = true, nocommand = false } = {}) {
  const { NODE_ENV } = process.env;
  const argv = [...process.argv];

  let [engine, input] = argv.splice(0, 2);
  let [command] = argv;
  let origin = argv.join(' ');

  let arg = { engine, input };

  if (!nocommand) {
    arg.command = command;
  }

  for (let key in configs) {
    arg[key] = configs[key];
  }

  let haserror = false;
  let errlists = [];

  for (let input of argv) {
    let [key, value] = input.split('=');

    if (!(configs.hasOwnProperty(key) || options.includes(key))) {
      haserror = true;
      errlists.push(key);
      origin = origin.replace(key, color.yellow(`![${color.redBright(key)}]`));
    }

    if (!value && configs.hasOwnProperty(key)) {
      value = typeof configs[key] === 'boolean' ? true : (argv.splice(argv.indexOf(input) + 1, 1)[0] || configs[key]);
    }

    if (!value && options.includes(key)) {
      value = true;
    }

    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if (typeof value === 'string' && Number(value)) {
      value = Number(value);
    }

    arg[key] = value || true;
  }

  if (haserror) {
    const error = new Error(`${color.redBright('Unknown argument(s):')} ${origin}${color.redBright('.')}`);

    if (protect) {
      arg.error = error;

      if (protect === 'throw') {
        throw arg.error;
      }
    }
  }

  for (let key in arg) {
    if (/^\-/.test(key)) {
      let rem = key.replace(/^\-\-/, '').replace(/^\-/, '');
      arg[rem] = arg[key];

      if (remdash === true) {
        delete arg[key];
      }
    }
  }

  let env = 'development';

  if (argv.includes('--staging')) {
    env = 'staging';
  }

  if (argv.includes('--production')) {
    env = 'production';
  }

  if (NODE_ENV) {
    env = NODE_ENV;
  }

  setCfg({ env, arg, uop: errlists });
  return { env, arg, uop: errlists };
}
