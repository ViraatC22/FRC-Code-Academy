import type { Lesson } from "../../types";

// Java for FRC — Module 1, Lesson 1. Same instructional standard as the FRC
// tracks: deep "why", worked examples, analogies, FRC use cases, teach→practice
// interleaved, runtime-tested labs. Java-language content may draw on standard
// Java references; FRC framing throughout.

export const javaVariablesLesson: Lesson = {
  id: "java-variables",
  title: "Variables & Types",
  blurb: "Name and store data the way Java demands — with a fixed type the compiler checks.",
  difficulty: "Easy",
  minutes: 0,
  objectives: [
    "Explain what a variable is and why Java requires a declared type for each one",
    "Choose the right primitive type (int, double, boolean, long, char) for a value",
    "Declare, initialize, reassign, and mark constants final with correct naming",
    "Predict the result of int vs double arithmetic and explicit casts",
    "Store and convert real robot quantities (ports, powers, flags) with correct types",
  ],
  sections: [
    // ── CONCEPT 1 ────────────────────────────────────────────────────────────
    {
      kind: "learn",
      title: "Why Java Has Types",
      minutes: 9,
      blurb: "A variable is a named box — and Java insists you label what goes in it.",
      blocks: [
        {
          type: "text",
          md: "A **variable** is a named box in memory that holds a value your program can read and change later. On a robot you are constantly juggling values — a motor's power, an encoder's count, whether a limit switch is pressed — and variables are how you give those values names so the rest of your code can refer to them.",
        },
        {
          type: "text",
          md: "What makes Java different from languages like Python is that it is **statically typed**: every variable has a fixed **type** declared up front, and that type can never change. `double speed = 0.5;` says 'this box named `speed` holds a decimal number, forever.' Try to put text in it and the code won't even compile.\n\nThis feels strict at first, but the strictness is the *point*, and it's exactly why FRC robots are written in Java:\n\n- **Errors are caught before the robot moves.** If you accidentally assign a boolean to a number, the compiler stops you at your desk — not on the field mid-match where a crash means a disabled robot.\n- **The code documents itself.** `double targetAngle` tells the next programmer precisely what kind of value lives there.\n- **It runs fast.** Knowing every type ahead of time lets the JVM generate efficient code, which matters when your robot loop must finish in 20 milliseconds.",
        },
        {
          type: "callout",
          tone: "info",
          md: "Think of a type as a label on the box that the compiler enforces. A box labeled `boolean` physically cannot hold the number `7`. That guarantee is what lets a 15-year-old confidently ship code that controls a 120-pound machine.",
        },
        {
          type: "quiz",
          question: "Why is Java's requirement that every variable have a fixed type an advantage for FRC robot code?",
          options: [
            "It makes the code shorter to write",
            "Type mismatches are caught by the compiler before the robot ever runs, instead of failing during a match",
            "It lets variables hold any kind of value at any time",
            "It removes the need for sensors",
          ],
          answerIndex: 1,
          explanation:
            "Static typing turns a whole class of mistakes into compile-time errors you fix at your desk, rather than runtime crashes that disable the robot on the field.",
        },
      ],
    },

    // ── CONCEPT 2 ────────────────────────────────────────────────────────────
    {
      kind: "learn",
      title: "The Primitive Types",
      minutes: 11,
      blurb: "The handful of built-in types, and which robot value each one fits.",
      blocks: [
        {
          type: "text",
          md: "Java's **primitive types** are the basic building blocks — values stored directly, not as objects. You'll use a few constantly in robot code:\n\n- **`double`** — a decimal number. The default for any real-world measurement: motor power (−1.0 to 1.0), distance in meters, an angle in degrees, battery volts. *When in doubt for a physical quantity, use `double`.*\n- **`int`** — a whole number. Counts and identifiers: an encoder tick count, a CAN device ID, a button number, a loop counter.\n- **`boolean`** — `true` or `false`. A yes/no fact: is the limit switch pressed, is the arm raised, is the path finished.\n- **`long`** — a whole number that can hold very large values (e.g. timestamps in microseconds). Reach for it when an `int` might overflow.\n- **`char`** — a single character, like `'A'`. Rare in robot code but part of the family.",
        },
        {
          type: "text",
          md: "Choosing the right type is a real decision, not a formality. The classic FRC mistake is storing a motor power as an `int`: `int speed = 0.5;` won't even compile, and `int speed = 1;` quietly throws away every value between off and full — there is no 'half power' in an `int`. Motor outputs are fractional, so they must be `double`. Conversely, a CAN ID is always a whole number, so `int` is correct and communicates intent. The type you pick is a promise about what the value *is*.",
        },
        {
          type: "code",
          lang: "java",
          caption: "Each robot value gets the type that fits it",
          code: "double shooterPower = 0.85;   // fractional output, -1.0..1.0\nint canId = 7;                // a whole-number device address\nboolean intakeRunning = false;// a yes/no flag\nlong startTimeMicros = 0L;     // a large whole number (note the L)",
        },
        {
          type: "predict",
          prompt: "Which declaration will fail to compile?",
          code: "double a = 0.75;\nint b = 3;\nboolean c = true;\nint d = 0.5;",
          options: [
            "double a = 0.75;",
            "int b = 3;",
            "boolean c = true;",
            "int d = 0.5;",
          ],
          answerIndex: 3,
          explanation:
            "`int d = 0.5;` fails: 0.5 is a decimal (a double) and an int can only hold whole numbers. Java refuses the narrowing automatically to stop you from silently losing the fraction.",
        },
        {
          type: "quiz",
          question: "You need to store a motor's output power. Which type is correct and why?",
          options: [
            "int, because motors use whole numbers",
            "boolean, because the motor is on or off",
            "double, because motor power is a fraction between -1.0 and 1.0",
            "long, because power values are large",
          ],
          answerIndex: 2,
          explanation:
            "Motor power is a decimal from -1.0 (full reverse) to 1.0 (full forward). Only a double can hold those fractional values; an int would collapse them to 0 or 1.",
        },
      ],
    },

    // ── CONCEPT 3 ────────────────────────────────────────────────────────────
    {
      kind: "learn",
      title: "Declaring, Reassigning & final",
      minutes: 8,
      blurb: "Create a variable once, change it freely — or lock it forever.",
      blocks: [
        {
          type: "text",
          md: "Declaring a variable has three parts: the **type**, the **name**, and (usually) an initial **value**.\n\n`double speed = 0.5;`\n\nAfter that you reassign it by name *without* repeating the type — the box already exists, you're just putting a new value in it:\n\n`speed = 0.75;` then later `speed = 0.0;`\n\nSome values should never change once set — a wheel diameter, a gear ratio, a CAN ID. Mark those **`final`**, and the compiler will reject any later reassignment. This isn't just tidiness: it makes tuning constants easy to find and prevents a whole category of bugs where a 'constant' is accidentally overwritten deep in the code.",
        },
        {
          type: "callout",
          tone: "tip",
          md: "Java naming convention carries meaning: ordinary variables use `camelCase` (`maxSpeed`, `targetAngle`), and `final` constants use `UPPER_SNAKE_CASE` (`WHEEL_DIAMETER`, `MAX_VOLTAGE`). Following it lets any reader tell a tuning constant from a changing value at a glance.",
        },
        {
          type: "code",
          lang: "java",
          caption: "A constant vs a changing variable",
          code: "final double WHEEL_DIAMETER = 0.1016;  // never changes — a fact about the robot\ndouble currentSpeed = 0.0;             // changes every loop\ncurrentSpeed = 0.6;                    // legal\n// WHEEL_DIAMETER = 0.2;               // compile error: cannot reassign final",
        },
        {
          type: "quiz",
          question: "Why mark a value like a wheel diameter or gear ratio as final?",
          options: [
            "It makes the robot faster",
            "The compiler then rejects any accidental reassignment, and the name signals it's a fixed tuning constant",
            "final variables use less memory",
            "It allows the value to change automatically",
          ],
          answerIndex: 1,
          explanation:
            "final encodes 'this never changes' as a rule the compiler enforces, preventing accidental overwrites and clearly marking the value as a constant.",
        },
      ],
    },

    // ── IMPLEMENT ────────────────────────────────────────────────────────────
    {
      kind: "implement",
      title: "Implement — Typed Robot Conversions",
      minutes: 7,
      blurb: "Use types and arithmetic to convert real robot quantities.",
      blocks: [
        {
          type: "text",
          md: "A constant pattern in robot code is converting between units and scales: a driver's percent into a motor fraction, encoder counts into distance, inches into meters. Getting the *types* right is what makes these correct. Here you'll convert a whole-number percentage (0–100) into a motor power fraction (0.0–1.0) — which forces you to combine an `int` input with `double` math.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Implementation lab — percent to motor power",
          prompt:
            "Write `double motorPower(int percent)` that converts a whole-number percentage (0–100) to a motor fraction by dividing by 100.0. Returning, e.g., motorPower(85) should give 0.85. (Dividing by 100.0 — not 100 — keeps the result a double.)",
          starter: "public double motorPower(int percent) {\n    // convert 0..100 into 0.0..1.0\n}",
          solution: "public double motorPower(int percent) {\n    return percent / 100.0;\n}",
          checks: [
            { label: "Divides by 100.0 (a double, not 100)", pattern: "percent\\s*/\\s*100\\.0" },
            { label: "Returns the result", pattern: "return\\s+" },
          ],
          hint: "`return percent / 100.0;` — the `.0` makes it double division so the fraction survives.",
          tests: [
            { method: "motorPower", args: [85], expected: 0.85, tolerance: 1e-9 },
            { method: "motorPower", args: [50], expected: 0.5, tolerance: 1e-9 },
            { method: "motorPower", args: [100], expected: 1.0, tolerance: 1e-9 },
            { method: "motorPower", args: [0], expected: 0.0 },
          ],
        },
      ],
    },

    // ── MASTER ───────────────────────────────────────────────────────────────
    {
      kind: "master",
      title: "Master — Casting & the Truncation Trap",
      minutes: 7,
      blurb: "Convert between types on purpose, and avoid losing data by accident.",
      blocks: [
        {
          type: "text",
          md: "Sometimes you must convert a value from one type to another — that's a **cast**, written `(type) value`. Going from a smaller range to a larger one (`int` → `double`) is safe and automatic, because every whole number is a valid decimal. Going the other way (`double` → `int`) **loses information**: Java *truncates* — it drops the fractional part entirely, it does not round. `(int) 3.9` is `3`, and `(int) -2.7` is `-2`.\n\nThis is a frequent source of silent bugs. If you cast a sensor's meters to an `int` to 'simplify' it, you've thrown away everything after the decimal point — a robot that thinks it has driven 3 meters when it has driven 3.9. Cast deliberately, and only when you truly want a whole number.",
        },
        {
          type: "code",
          lang: "java",
          caption: "Widening is automatic; narrowing truncates",
          code: "int ticks = 250;\ndouble exact = ticks;        // 250.0 — safe, automatic\n\ndouble meters = 3.9;\nint whole = (int) meters;     // 3 — fraction dropped, NOT rounded",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Mastery lab — whole revolutions",
          prompt:
            "An encoder reports a possibly-fractional number of revolutions. Write `int fullRevolutions(double revs)` that returns how many WHOLE revolutions have completed, truncating the fraction with an (int) cast. fullRevolutions(3.9) is 3.",
          starter: "public int fullRevolutions(double revs) {\n    // return the whole-number part of revs\n}",
          solution: "public int fullRevolutions(double revs) {\n    return (int) revs;\n}",
          checks: [
            { label: "Casts revs to int", pattern: "\\(\\s*int\\s*\\)\\s*revs" },
            { label: "Returns the cast value", pattern: "return\\s+" },
          ],
          hint: "`return (int) revs;` — the cast drops the fractional part.",
          tests: [
            { method: "fullRevolutions", args: [3.9], expected: 3 },
            { method: "fullRevolutions", args: [0.4], expected: 0 },
            { method: "fullRevolutions", args: [7.0], expected: 7 },
            { method: "fullRevolutions", args: [12.99], expected: 12 },
          ],
        },
        {
          type: "knowledgeCheck",
          title: "Mastery check — types in practice",
          questions: [
            {
              question: "What is the value of `(int) 3.9` in Java?",
              options: ["4", "3", "3.9", "It won't compile"],
              answerIndex: 1,
              explanation: "Casting a double to an int truncates (drops the fraction), it does not round — so 3.9 becomes 3.",
            },
            {
              question: "A teammate stores a gyro heading (like 47.3 degrees) in an int to 'keep it simple.' What's the consequence?",
              options: [
                "Nothing — headings are whole numbers",
                "The fractional degrees are silently truncated, so the robot's heading is wrong by up to a degree",
                "The code won't compile",
                "The gyro stops working",
              ],
              answerIndex: 1,
              explanation:
                "A heading is a continuous measurement; forcing it into an int throws away the fraction, introducing error in every turn-to-angle calculation that uses it. Keep measured quantities as double.",
            },
          ],
        },
      ],
    },
  ],
};
