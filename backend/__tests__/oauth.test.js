"use strict";
const crypto = require("crypto");

function generateOAuthState() {
  return crypto.randomBytes(16).toString("hex");
}

function validateOAuthState(provided, stored) {
  if (!provided || !stored) return false;
  return provided === stored;
}

test("generated state is 32-char hex string", () => {
  const state = generateOAuthState();
  expect(state).toMatch(/^[0-9a-f]{32}$/);
});

test("valid state passes validation", () => {
  const state = generateOAuthState();
  expect(validateOAuthState(state, state)).toBe(true);
});

test("mismatched state fails validation", () => {
  expect(validateOAuthState("abc", "xyz")).toBe(false);
});

test("missing state fails validation", () => {
  expect(validateOAuthState(null, "xyz")).toBe(false);
  expect(validateOAuthState("abc", null)).toBe(false);
  expect(validateOAuthState("", "xyz")).toBe(false);
});
