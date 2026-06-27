import type { Lesson } from "../../types";

export const javaControlFlowLesson: Lesson = {
  id: "java-control-flow",
  title: "Control Flow",
  blurb: "Make code take decisions and repeat work — the logic behind every robot behavior.",
  difficulty: "Easy",
  minutes: 0,
  objectives: [
    "Branch with if / else if / else and choose between many cases with switch",
    "Repeat work with for and while loops and know when each fits",
    "Use break and continue, and avoid loops that block the robot's 20 ms cycle",
    "Trace nested conditions and loops by hand",
    "Implement decision and counting logic for real robot scenarios",
  ],
  sections: [
    {
      kind: "learn",
      title: "Making Decisions — if / else",
      minutes: 9,
      blurb: "Run different code depending on what's true right now.",
      blocks: [
        {
          type: "text",
          md: "**Control flow** is how a program decides *what to do next*. Without it, code runs top to bottom once and does the same thing every time — useless for a robot that must react to its sensors. The `if` statement is the foundation: it runs a block of code *only when* a boolean condition is true.\n\n```\nif (condition) {\n    // runs only when condition is true\n}\n```\n\nThis is the moment your sensor readings turn into behavior. `if (encoder.getDistance() >= target)` is the robot deciding it has driven far enough and acting on it.",
        },
        {
          type: "text",
          md: "Real decisions usually have more than two outcomes, which is what `else if` and `else` are for. Java checks each condition **in order** and runs the *first* one that's true, then skips the rest:\n\n```\nif (height < 0.3) {\n    level = \"low\";\n} else if (height < 1.0) {\n    level = \"mid\";\n} else {\n    level = \"high\";\n}\n```\n\nOrder matters enormously here. Because Java stops at the first match, your conditions must be arranged so the right one wins. If you wrote the `height < 1.0` test before `height < 0.3`, every low height would match `< 1.0` first and you'd never reach the `low` case. Reading the chain top-to-bottom, each `else if` quietly assumes all the conditions above it were false.",
        },
        {
          type: "callout",
          tone: "tip",
          md: "When you're choosing one path among many *discrete* values — say, an autonomous routine selected by number — a `switch` statement can read more cleanly than a long if/else chain. But for ranges and boolean logic, if/else is the tool.",
        },
        {
          type: "quiz",
          question: "In an if / else if / else chain, what determines which block runs?",
          options: [
            "All blocks whose condition is true run",
            "Only the first block whose condition is true runs; the rest are skipped",
            "The last true condition wins",
            "They run in random order",
          ],
          answerIndex: 1,
          explanation:
            "Java evaluates the conditions top to bottom and runs the first true one, then exits the chain. This is why the order of your conditions matters.",
        },
      ],
    },
    {
      kind: "learn",
      title: "Repeating Work — Loops",
      minutes: 11,
      blurb: "Do something many times without copying code.",
      blocks: [
        {
          type: "text",
          md: "A **loop** repeats a block of code. The `for` loop is built for counting a known number of times — its header bundles the three parts of a count into one line: a start, a continue-condition, and a step.\n\n```\nfor (int i = 0; i < 4; i++) {\n    configureModule(i);   // runs for i = 0, 1, 2, 3\n}\n```\n\nThis is how you handle the four swerve modules, the rows of an LED strip, or every entry in an array without writing the same line four times. The counter `i` is available inside the loop so each pass can act on a different item.",
        },
        {
          type: "text",
          md: "The `while` loop repeats as long as a condition stays true, which fits when you *don't* know the count in advance:\n\n```\nwhile (!gyro.isCalibrated()) {\n    wait();\n}\n```\n\nTwo control statements fine-tune loops: `break` exits the loop immediately, and `continue` skips to the next iteration. Use them sparingly — a loop that's easy to read beats a clever one.",
        },
        {
          type: "callout",
          tone: "warn",
          md: "On a robot, a loop must always *finish quickly*. Your code runs inside a 20 ms cycle, and a long-running or infinite loop **blocks everything** — the robot stops responding to the driver, stops updating other mechanisms, and can be flagged as unresponsive. Never `while (true)` wait for something in robot code; instead check the condition once per cycle and let the loop come back to you. This is the single most important difference between a homework loop and a robot loop.",
        },
        {
          type: "predict",
          prompt: "What does this loop print as its final sum?",
          code: "int sum = 0;\nfor (int i = 1; i <= 4; i++) {\n    sum += i;\n}\nSystem.out.println(sum);",
          options: ["10", "4", "6", "15"],
          answerIndex: 0,
          explanation:
            "i takes the values 1, 2, 3, 4 (stops when i becomes 5 because 5 <= 4 is false). 1 + 2 + 3 + 4 = 10.",
        },
        {
          type: "quiz",
          question: "Why is `while (!sensor.ready()) { }` busy-waiting dangerous in a robot's periodic code?",
          options: [
            "while loops aren't allowed in Java",
            "It blocks the 20 ms robot loop, freezing driver control and every other mechanism until the condition changes",
            "It uses too much memory",
            "Sensors can't be read in a loop",
          ],
          answerIndex: 1,
          explanation:
            "Robot code runs on a fixed cycle. A loop that spins until something happens prevents the cycle from completing, so nothing else on the robot updates. Check the condition once per cycle instead.",
        },
      ],
    },
    {
      kind: "implement",
      title: "Implement — Classify a Height",
      minutes: 7,
      blurb: "Turn a continuous measurement into a discrete decision.",
      blocks: [
        {
          type: "text",
          md: "Elevators and arms often have named target positions — low, mid, high — and code needs to report which band the mechanism is currently in, for dashboards or scoring logic. That's an ordered if/else chain translating a continuous height into a discrete level. The ordering of the comparisons is the whole game.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Implementation lab — elevator level",
          prompt:
            "Write `String level(double height)`: return \"low\" if height is less than 0.3, \"mid\" if it is less than 1.0, and \"high\" otherwise. Order your conditions so each is correct.",
          starter:
            "public String level(double height) {\n    // < 0.3 -> low, < 1.0 -> mid, else high\n}",
          solution:
            "public String level(double height) {\n    if (height < 0.3) {\n        return \"low\";\n    } else if (height < 1.0) {\n        return \"mid\";\n    } else {\n        return \"high\";\n    }\n}",
          checks: [
            { label: "Checks the low band first (< 0.3)", pattern: "height\\s*<\\s*0\\.3" },
            { label: "Checks the mid band (< 1.0)", pattern: "height\\s*<\\s*1\\.0" },
            { label: "Returns the three level strings", pattern: "return\\s+\"(low|mid|high)\"" },
          ],
          hint: "Test the smallest range first: `if (height < 0.3) return \"low\"; else if (height < 1.0) return \"mid\"; else return \"high\";`.",
          tests: [
            { method: "level", args: [0.1], expected: "low" },
            { method: "level", args: [0.5], expected: "mid" },
            { method: "level", args: [1.5], expected: "high" },
            { method: "level", args: [0.3], expected: "mid" },
            { method: "level", args: [1.0], expected: "high" },
          ],
        },
      ],
    },
    {
      kind: "master",
      title: "Master — Looping Over Sensor Data",
      minutes: 7,
      blurb: "Use a loop to process an array of readings.",
      blocks: [
        {
          type: "text",
          md: "Robots gather data in bulk — four module speeds, a strip of sensor distances, a list of recorded samples — and a `for` loop is how you process all of it. A common task is reducing many readings to one number: a sum, a maximum, an average. Here you'll count how many readings in an array exceed a threshold, the pattern behind 'how many sensors see a target' or 'how many modules are over their speed limit.' You walk the array with an index, test each element, and tally the hits.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Mastery lab — count over threshold",
          prompt:
            "Write `int countAbove(double[] readings, double threshold)` that returns how many entries in `readings` are strictly greater than `threshold`. Loop over the array with an index and count the matches.",
          starter:
            "public int countAbove(double[] readings, double threshold) {\n    int count = 0;\n    // loop over readings; add 1 for each entry > threshold\n    return count;\n}",
          solution:
            "public int countAbove(double[] readings, double threshold) {\n    int count = 0;\n    for (int i = 0; i < readings.length; i++) {\n        if (readings[i] > threshold) {\n            count += 1;\n        }\n    }\n    return count;\n}",
          checks: [
            { label: "Loops over the array by index", pattern: "for\\s*\\(\\s*int\\s+i\\s*=\\s*0\\s*;\\s*i\\s*<\\s*readings\\.length" },
            { label: "Tests each element against the threshold", pattern: "readings\\[\\s*i\\s*\\]\\s*>\\s*threshold" },
            { label: "Counts the matches", pattern: "count\\s*\\+=\\s*1|count\\+\\+" },
          ],
          hint: "`for (int i = 0; i < readings.length; i++) { if (readings[i] > threshold) { count += 1; } }`.",
          tests: [
            { method: "countAbove", args: [[1.0, 2.0, 3.0, 4.0], 2.5], expected: 2 },
            { method: "countAbove", args: [[0.1, 0.2], 1.0], expected: 0 },
            { method: "countAbove", args: [[5.0, 5.0, 5.0], 1.0], expected: 3 },
            { method: "countAbove", args: [[2.5, 2.5], 2.5], expected: 0 },
          ],
        },
        {
          type: "knowledgeCheck",
          title: "Mastery check — control flow",
          questions: [
            {
              question: "How many times does the body run: `for (int i = 0; i < 4; i++)`?",
              options: ["3", "4", "5", "Forever"],
              answerIndex: 1,
              explanation: "i takes 0, 1, 2, 3 — four iterations — then stops when i becomes 4 because 4 < 4 is false.",
            },
            {
              question: "A teammate writes `while (!atTarget()) { drive(); }` directly in teleopPeriodic(). What goes wrong?",
              options: [
                "Nothing — it drives until at target",
                "The loop blocks the periodic cycle, so the robot freezes (no driver input, no other mechanisms) until atTarget becomes true",
                "drive() can't be called in a loop",
                "It runs only once",
              ],
              answerIndex: 1,
              explanation:
                "Periodic code must return quickly. A loop that waits for a condition stalls the entire 20 ms cycle. The right approach is to check atTarget() once per cycle and act, letting periodic be called again next loop.",
            },
          ],
        },
      ],
    },
  ],
};
