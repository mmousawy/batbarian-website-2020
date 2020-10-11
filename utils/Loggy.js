const Loggy = {
  _get: (strings, ...values) => {
    let str = '';

    strings.forEach((string, i) => {
      str += string + (values[i] !== undefined ? values[i] : '');
    });

    return str;
  },

  _apply: (colorCode, strings, ...values) => `\x1b[${colorCode}m` + `${Loggy._get(strings, ...values)}` + '\x1b[0m',

  bold:       (strings, ...values) => Loggy._apply(1, strings, ...values),
  underscore: (strings, ...values) => Loggy._apply(4, strings, ...values),

  white:      (strings, ...values) => Loggy._apply(97, strings, ...values),
  grey:       (strings, ...values) => Loggy._apply(37, strings, ...values),
  red:        (strings, ...values) => Loggy._apply(31, strings, ...values),
  yellow:     (strings, ...values) => Loggy._apply(33, strings, ...values),
  cyan:       (strings, ...values) => Loggy._apply(96, strings, ...values),
  green:      (strings, ...values) => Loggy._apply(32, strings, ...values),
  blue:       (strings, ...values) => Loggy._apply(34, strings, ...values),
};

module.exports = Loggy;
