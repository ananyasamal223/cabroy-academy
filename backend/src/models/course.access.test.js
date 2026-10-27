import test from "node:test";
import assert from "node:assert/strict";
import Course from "./Course.js";
const course = accessOptions => new Course({ title: "Example", slug: "example", instructor: "507f1f77bcf86cd799439011", ...(accessOptions === undefined ? {} : { accessOptions }) });
test("existing courses default to individual purchase", () => {
  assert.deepEqual(course().accessOptions.toObject(), ["individual"]);
});
test("multiple access options persist in the course document", async () => {
  const item = course(["individual", "starter", "pro", "business"]);
  await item.validate();
  assert.deepEqual(item.toObject().accessOptions, ["individual", "starter", "pro", "business"]);
});
test("free, empty and duplicate access options are rejected", async () => {
  for (const options of [["free"], [], ["starter", "starter"]]) await assert.rejects(course(options).validate());
});
