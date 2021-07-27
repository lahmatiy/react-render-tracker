import { TestCase } from "../types";
import { default as case1 } from "./basic";
import { default as case2 } from "./basic-nested-set-state";
import { default as case3 } from "./basic-context-change";
import { default as case4 } from "./set-state-by-event-handler";

export default [case1, case2, case3, case4] as TestCase[];
