import type { Lesson } from "../../types";

export const javaOperatorsLesson: Lesson = {
  id: "java-operators",
  title: "Operators & Expressions",
  blurb: "Compute with values — and dodge the integer-division bug that bites every team.",
  difficulty: "Easy",
  minutes: 0,
  objectives: [
    "Use arithmetic, comparison, and logical operators to build expressions",
    "Explain why int / int discards the remainder, and how to force decimal division",
    "Combine conditions with && and || and reason about their short-circuiting",
    "Apply operator precedence and compound assignment correctly",
    "Find and fix a real averaging bug caused by integer division",
  ],
  sections: [
    {
      kind: "learn",
      title: "Arithmetic & the Integer-Division Trap",
      minutes: 11,
      blurb: "The math operators — and the one that silently throws away your decimals.",
      blocks: [
        {
          type: "text",
          md: "Java's arithmetic operators are the ones you'd expect: `+`, `-`, `*`, `/`, and `%` (remainder). They combine values into **expressions** that evaluate to a single result, which you can store or use directly. So far, so ordinary — except for one rule that causes more first-year FRC bugs than almost anything else.",
        },
        {
          type: "text",
          md: "**The type of a division depends on the types of its operands.** If *both* sides of `/` are `int`, Java performs **integer division** — it computes the whole-number quotient and *throws the remainder away*. So `7 / 2` is `3`, not `3.5`. The `.5` doesn't round; it's simply discarded. The same expression with a decimal anywhere — `7 / 2.0`, `7.0 / 2`, or `(double) 7 / 2` — gives `3.5`, because once one operand is a `double` the whole operation is done in decimal.\n\nWhy does Java do this? Because `int` arithmetic is exact and fast, and the language won't silently change your `int` result into a `double` behind your back — that would be a hidden type change. The cost is that *you* must remember to make division decimal when you want a fraction.",
        },
        {
          type: "callout",
          tone: "warn",
          md: "This bug is invisible: the code compiles, runs, and returns a *plausible* number that's just wrong. `int average = (a + b) / 2;` quietly loses the half. Averaging two encoder distances, computing a gear ratio, or splitting a joystick range this way will drift your robot off by amounts that are maddening to track down. Whenever a division should produce a fraction, make at least one operand a `double` (e.g. divide by `2.0`).",
        },
        {
          type: "code",
          lang: "java",
          caption: "The difference one decimal point makes",
          code: "int    a = 7 / 2;     // 3   — integer division drops the .5\ndouble b = 7 / 2;     // 3.0 — still int division, THEN widened (too late!)\ndouble c = 7 / 2.0;   // 3.5 — one double operand fixes it\ndouble d = 7.0 / 2;   // 3.5 — same",
        },
        {
          type: "predict",
          prompt: "What does this print?",
          code: "int a = 5;\nint b = 2;\ndouble result = a / b;\nSystem.out.println(result);",
          options: ["2.5", "2.0", "3.0", "2"],
          answerIndex: 1,
          explanation:
            "Both a and b are int, so a / b is integer division = 2 (remainder dropped). Assigning to a double then widens 2 to 2.0 — too late to recover the .5. Use a / 2.0 or (double) a / b to get 2.5.",
        },
        {
          type: "coding",
          variant: "debug",
          title: "Debugging challenge — the lost half",
          prompt:
            "This method averages two encoder distances but uses integer division, so it drops the fraction (averaging 3 and 4 gives 3, not 3.5). The inputs are ints; fix the division so the true decimal average is returned.",
          starter:
            "public double average(int a, int b) {\n    return (a + b) / 2;   // bug: int / int truncates\n}",
          solution: "public double average(int a, int b) {\n    return (a + b) / 2.0;\n}",
          checks: [
            { label: "Divides by 2.0 to force decimal division", pattern: "\\(\\s*a\\s*\\+\\s*b\\s*\\)\\s*/\\s*2\\.0" },
          ],
          hint: "`(a + b)` is an int; dividing by `2.0` makes the whole expression a double: `(a + b) / 2.0`.",
          tests: [
            { method: "average", args: [3, 4], expected: 3.5, tolerance: 1e-9 },
            { method: "average", args: [10, 20], expected: 15.0, tolerance: 1e-9 },
            { method: "average", args: [5, 2], expected: 3.5, tolerance: 1e-9 },
            { method: "average", args: [0, 0], expected: 0.0 },
          ],
        },
      ],
    },
    {
      kind: "learn",
      title: "Comparison & Logical Operators",
      minutes: 10,
      blurb: "Ask true/false questions and combine them.",
      blocks: [
        {
          type: "text",
          md: "**Comparison operators** ask a yes/no question and produce a `boolean`: `==` (equal), `!=` (not equal), `<`, `>`, `<=`, `>=`. These are the questions a robot constantly asks: `distance >= target`, `voltage < 7.0`, `buttonId == 1`.\n\nA crucial warning for `double` values: never test two decimals for exact equality with `==`. Floating-point math accumulates tiny rounding errors, so `angle == 90.0` is almost never true even when the angle is 'basically 90.' Instead test whether the difference is small: `Math.abs(angle - 90.0) < 0.5`. (This is exactly why a PID controller uses a *tolerance* rather than waiting for error to hit exactly zero.)",
        },
        {
          type: "text",
          md: "**Logical operators** combine booleans:\n\n- `&&` (AND) — true only if *both* sides are true: `armUp && clawClosed`\n- `||` (OR) — true if *either* side is true: `atTop || atBottom`\n- `!` (NOT) — flips a boolean: `!intakeRunning`\n\nThese **short-circuit**, which is both an efficiency and a safety feature. In `a && b`, if `a` is false Java never even evaluates `b` (the result is already decided). That lets you guard a risky check: `result.hasTargets() && result.getBestTarget().getYaw() > 5` safely skips the second half when there's no target, avoiding a crash. With `||`, if the first operand is true the second is skipped.",
        },
        {
          type: "code",
          lang: "java",
          caption: "Comparisons and logic in robot conditions",
          code: "boolean readyToShoot = atSpeed && hasGamePiece;\nboolean needStop = atTop || atBottom;\nboolean atTarget = Math.abs(angle - 90.0) < 0.5;  // tolerance, not ==",
        },
        {
          type: "quiz",
          question: "Why should you avoid `if (angle == 90.0)` when angle is a double from a sensor?",
          options: [
            "== doesn't work on doubles at all",
            "Floating-point rounding means the value is almost never exactly 90.0; test Math.abs(angle - 90.0) < tolerance instead",
            "It's slower than using <",
            "90.0 must be written as 90",
          ],
          answerIndex: 1,
          explanation:
            "Decimal math carries tiny rounding errors, so exact equality almost never holds. Comparing within a small tolerance is the robust pattern — the same reason PID uses atSetpoint with a tolerance.",
        },
        {
          type: "quiz",
          question: "In `result.hasTargets() && result.getBestTarget().getYaw() > 5`, what does short-circuiting guarantee when there is no target?",
          options: [
            "Both sides run, then the result is discarded",
            "The second half is skipped, so getBestTarget() is never called on missing data",
            "The condition throws an error",
            "hasTargets() is skipped",
          ],
          answerIndex: 1,
          explanation:
            "With &&, a false left operand makes the whole expression false, so Java never evaluates the right side — safely skipping getBestTarget() when there's nothing to read.",
        },
      ],
    },
    {
      kind: "learn",
      title: "Precedence & Compound Assignment",
      minutes: 6,
      blurb: "The order operations happen, and shorthands for updating a value.",
      blocks: [
        {
          type: "text",
          md: "Java evaluates operators in a fixed **precedence** order — `*`, `/`, `%` before `+`, `-`, just like in math — and you use parentheses to override it. `2 + 3 * 4` is `14`, while `(2 + 3) * 4` is `20`. When a calculation matters (and on a robot it controls real motion), prefer explicit parentheses even when they're technically optional; they cost nothing and remove all doubt for the next reader.",
        },
        {
          type: "text",
          md: "**Compound assignment** operators update a variable using its own current value: `x += 5` means `x = x + 5`, and `-=`, `*=`, `/=` work the same way. The `++` and `--` operators add or subtract one, common in loop counters. You'll see `integral += error` in every PID controller and `i++` in every counting loop — they're shorthand, not new behavior.",
        },
        {
          type: "predict",
          prompt: "What is the final value printed?",
          code: "int x = 2 + 3 * 4;\nx += 10;\nSystem.out.println(x);",
          options: ["24", "30", "60", "14"],
          answerIndex: 0,
          explanation:
            "3 * 4 = 12 happens before the +, so 2 + 12 = 14. Then x += 10 makes it 24.",
        },
      ],
    },
    {
      kind: "implement",
      title: "Implement — A Deadband",
      minutes: 7,
      blurb: "Combine arithmetic and comparison into a real driver-control helper.",
      blocks: [
        {
          type: "text",
          md: "Joysticks never rest at exactly zero — a released stick still reports tiny values like 0.03, which would creep the robot. Teams apply a **deadband**: if the input's magnitude is below a threshold, force it to zero; otherwise pass it through. This is arithmetic (`Math.abs`) and comparison working together — a tiny function every robot's drive code uses.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Implementation lab — joystick deadband",
          prompt:
            "Write `double deadband(double input, double threshold)`: if the absolute value of `input` is less than `threshold`, return 0.0; otherwise return `input` unchanged. Use `Math.abs(...)` and a comparison.",
          starter:
            "public double deadband(double input, double threshold) {\n    // below the threshold magnitude -> 0.0, else input\n}",
          solution:
            "public double deadband(double input, double threshold) {\n    if (Math.abs(input) < threshold) {\n        return 0.0;\n    }\n    return input;\n}",
          checks: [
            { label: "Tests Math.abs(input) against the threshold", pattern: "Math\\.abs\\(\\s*input\\s*\\)\\s*<\\s*threshold" },
            { label: "Returns 0.0 inside the deadband", pattern: "return\\s+0\\.0" },
            { label: "Returns input outside it", pattern: "return\\s+input" },
          ],
          hint: "`if (Math.abs(input) < threshold) { return 0.0; }` then `return input;`.",
          tests: [
            { method: "deadband", args: [0.03, 0.1], expected: 0.0 },
            { method: "deadband", args: [0.5, 0.1], expected: 0.5, tolerance: 1e-9 },
            { method: "deadband", args: [-0.4, 0.1], expected: -0.4, tolerance: 1e-9 },
            { method: "deadband", args: [-0.05, 0.1], expected: 0.0 },
          ],
        },
      ],
    },
    {
      kind: "master",
      title: "Master — Reading Compound Conditions",
      minutes: 6,
      blurb: "Put arithmetic, comparison, and logic together the way real robot code does.",
      blocks: [
        {
          type: "text",
          md: "Real robot conditions stack several operators, and reading them fluently is a skill. Consider a shooter that should fire only when it's up to speed *and* either the driver pressed fire *or* an auto-fire mode is on:\n\n`atSpeed && (driverFire || autoFire)`\n\nThe parentheses matter: without them, precedence would group it as `(atSpeed && driverFire) || autoFire`, which would fire on autoFire even when *not* at speed — a very different, and dangerous, behavior. When logic controls motion, parenthesize your intent explicitly.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Mastery lab — clear to shoot",
          prompt:
            "Write `boolean clearToShoot(boolean atSpeed, boolean driverFire, boolean autoFire)` that returns true only when `atSpeed` is true AND (`driverFire` OR `autoFire`) is true. Use && and || with parentheses.",
          starter:
            "public boolean clearToShoot(boolean atSpeed, boolean driverFire, boolean autoFire) {\n    // atSpeed AND (driverFire OR autoFire)\n}",
          solution:
            "public boolean clearToShoot(boolean atSpeed, boolean driverFire, boolean autoFire) {\n    return atSpeed && (driverFire || autoFire);\n}",
          checks: [
            { label: "Combines with && and a parenthesized ||", pattern: "atSpeed\\s*&&\\s*\\(\\s*driverFire\\s*\\|\\|\\s*autoFire\\s*\\)" },
          ],
          hint: "`return atSpeed && (driverFire || autoFire);` — the parentheses force the OR to group first.",
          tests: [
            { method: "clearToShoot", args: [true, true, false], expected: true },
            { method: "clearToShoot", args: [true, false, true], expected: true },
            { method: "clearToShoot", args: [true, false, false], expected: false },
            { method: "clearToShoot", args: [false, true, true], expected: false },
          ],
        },
        {
          type: "knowledgeCheck",
          title: "Mastery check — operators",
          questions: [
            {
              question: "What does `9 % 4` evaluate to?",
              options: ["2", "1", "2.25", "0"],
              answerIndex: 1,
              explanation: "% is the remainder operator: 9 divided by 4 is 2 with remainder 1, so 9 % 4 is 1.",
            },
            {
              question: "Why prefer explicit parentheses in `atSpeed && (driverFire || autoFire)` even though && and || have a defined precedence?",
              options: [
                "Parentheses are required or it won't compile",
                "They make the intended grouping unmistakable, preventing a logic bug where autoFire could fire the shooter while not at speed",
                "They make the code run faster",
                "They convert the booleans to doubles",
              ],
              answerIndex: 1,
              explanation:
                "Without parentheses the expression groups as (atSpeed && driverFire) || autoFire — a different and dangerous meaning. Explicit parentheses lock in the intent.",
            },
          ],
        },
      ],
    },
  ],
};
