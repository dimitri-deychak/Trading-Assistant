export const formatNumber = (num: number | string, integer?: boolean) => {
  const toFixedValue = integer ? 0 : 2;
  return typeof num === 'number' ? Number(num.toFixed(toFixedValue)) : Number(parseFloat(num).toFixed(toFixedValue));
};

export const debounce = (func: Function, timeout: number = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};
