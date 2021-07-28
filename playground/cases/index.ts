import { TestCase } from "../types";
import { default as case1 } from "./basic";
import { default as case2 } from "./basic-nested-set-state";
import { default as case3 } from "./basic-nested-props-change";
import { default as case4 } from "./basic-parent-element-change";
import { default as case5 } from "./basic-context-change";
import { default as case6 } from "./set-state-by-event-handler";

export default [case1, case2, case3, case4, case5, case6] as TestCase[];
