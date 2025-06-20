import { z } from "zod";

export const ProblemsRecordSchema = z.record(
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    template: z.string(),
    tests: z.array(
      z.object({
        input: z.array(z.any()),
        expected: z.any(),
      })
    ),
  })
);

export interface TestCase {
  input: any[];
  expected: any;
}

export interface TestResult {
  test: number;
  passed: boolean;
  result?: any;
  expected?: any;
  error?: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  template: string;
  tests: TestCase[];
}
