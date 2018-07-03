const wrap =
  (func, ...args) => new Promise(
    (resolve) => func(...args, (...callback_args) => resolve(callback_args))
  );

const bindWrap = (context) => (func, ...args) => wrap(func.bind(context), ...args);


module.exports = {
    wrap,
    bindWrap
}
