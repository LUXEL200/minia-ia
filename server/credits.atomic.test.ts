import { describe, expect, it } from "vitest";
import { getAffectedRows } from "./db";

describe("atomic credit deduction result handling", () => {
  it("accepts a direct mysql2 ResultSetHeader after a successful debit", () => {
    expect(getAffectedRows({ affectedRows: 1 })).toBe(1);
  });

  it("accepts Drizzle/mysql2 tuple-shaped update results", () => {
    expect(getAffectedRows([{ affectedRows: 1 }])).toBe(1);
  });

  it("does not treat a guarded no-op as a successful debit", () => {
    expect(getAffectedRows([{ affectedRows: 0 }])).toBe(0);
    expect(getAffectedRows(undefined)).toBe(0);
  });
});
