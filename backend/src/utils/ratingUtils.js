/**
 * Checks whether a duplicate rating already exists.
 * @param {object|null} existing - The result of a findUnique/findFirst query for an existing rating.
 * @returns {boolean} true if a duplicate exists (existing is non-null), false otherwise.
 */
function checkDuplicateRating(existing) {
  return existing !== null && existing !== undefined;
}

module.exports = { checkDuplicateRating };
