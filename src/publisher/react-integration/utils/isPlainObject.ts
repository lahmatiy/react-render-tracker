export function isPlainObject(value: any) {
  return (
    value !== null &&
    typeof value === "object" &&
    value.constructor === Object &&
    typeof value.$$typeof !== "symbol"
  );
}
