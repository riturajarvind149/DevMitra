/**
 * Safely parse and clamp pagination params from a request query string.
 * @param {object} query - req.query
 * @param {number} defaultLimit
 * @returns {{ take: number, skip: number }}
 */
function parsePagination(query, defaultLimit = 50) {
  const rawLimit  = parseInt(query.limit,  10);
  const rawOffset = parseInt(query.offset, 10);

  const take = Number.isFinite(rawLimit)  ? Math.max(1,   Math.min(rawLimit,  100)) : defaultLimit;
  const skip = Number.isFinite(rawOffset) ? Math.max(0,   rawOffset)                : 0;
  return { take, skip };
}

module.exports = { parsePagination };
