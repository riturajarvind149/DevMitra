"use strict";
const { parsePagination } = require("../src/utils/pagination");

test("clamps negative limit to 1", () => {
  const { take } = parsePagination({ limit: "-5" });
  expect(take).toBe(1);
});

test("clamps negative offset to 0", () => {
  const { skip } = parsePagination({ offset: "-10" });
  expect(skip).toBe(0);
});

test("uses defaults when params are absent", () => {
  const { take, skip } = parsePagination({}, 50);
  expect(take).toBe(50);
  expect(skip).toBe(0);
});

test("caps limit at 100", () => {
  const { take } = parsePagination({ limit: "999" });
  expect(take).toBe(100);
});

test("parses valid limit and offset", () => {
  const { take, skip } = parsePagination({ limit: "20", offset: "40" });
  expect(take).toBe(20);
  expect(skip).toBe(40);
});
