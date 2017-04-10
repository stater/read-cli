let env = 'default', arg = {}, uop = [];

export function setCfg(res) {
  env = res.env;
  arg = res.arg;
  uop = res.uop;
}

export function byEnv(object = {}) {
  return merge(env, object);
}

export function byOpt(options = [], object = {}) {
  let opt;

  for (let name of options) {
    if (arg.hasOwnProperty(name)) {
      if (arg[name] === true) {
        opt = name.replace(/^\-\-/, '');
      } else {
        opt = arg[name];
      }
    }

    if (process.env[name]) {
      opt = process.env[name];
    }
  }

  return merge(opt, object);
}

function merge(opt, object = {}) {
  let def = object.default || {};
  let rep = {};

  if (object.hasOwnProperty(opt)) {
    rep = object[opt];
  }

  for (let key in rep) {
    if (rep.hasOwnProperty(key)) {
      def[key] = rep[key];
    }
  }

  return def;
}
