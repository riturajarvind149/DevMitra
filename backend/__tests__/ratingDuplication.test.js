"use strict";
const { checkDuplicateRating } = require("../src/utils/ratingUtils");

test("returns true when duplicate exists", () => {
  expect(checkDuplicateRating({ id: "existing-id" })).toBe(true);
});

test("returns false when no duplicate (null)", () => {
  expect(checkDuplicateRating(null)).toBe(false);
});

test("returns false when no duplicate (undefined)", () => {
  expect(checkDuplicateRating(undefined)).toBe(false);
});
