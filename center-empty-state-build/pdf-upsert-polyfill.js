// pdf.js 6 calls the TC39 "upsert" methods on Map/WeakMap; older browsers lack them.
for (const Collection of [Map, WeakMap]) {
  Collection.prototype.getOrInsert ??= function (key, value) {
    if (!this.has(key)) this.set(key, value);
    return this.get(key);
  };
  Collection.prototype.getOrInsertComputed ??= function (key, compute) {
    if (!this.has(key)) this.set(key, compute(key));
    return this.get(key);
  };
}
