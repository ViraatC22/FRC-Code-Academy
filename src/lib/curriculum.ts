import type { Track, Lesson, Block } from "./types";
import { intermediateTrack } from "./track-intermediate";
import { advancedTrack } from "./track-advanced";
import { swerveTrack } from "./track-swerve";

// ---------------------------------------------------------------------------
// Beginner Track: "I have never programmed" -> ready for command-based robots.
// Content is intentionally FRC-flavored: every concept lands on a robot example.
// ---------------------------------------------------------------------------

const variables: Lesson = {
  id: "variables",
  difficulty: "Easy",
  title: "Variables, Types & Units",
  blurb: "Store the numbers your robot cares about — and the type/unit discipline that keeps control code correct.",
  minutes: 15,
  blocks: [
    {
      type: "text",
      md: "A **variable** is a named box that holds a value. On a robot you are constantly tracking numbers — a motor's speed, how far a wheel has turned, the angle the robot is facing. Variables are how you give those numbers names so your code can read them back later.",
    },
    {
      type: "code",
      lang: "java",
      caption: "Declaring variables in Java",
      code: "double speed = 0.5;        // 50% power, range -1.0 to 1.0\nint encoderTicks = 0;      // whole-number sensor count\nboolean armRaised = false; // a yes/no flag",
    },
    {
      type: "text",
      md: "Each variable has a **type** that says what kind of value it holds:\n\n- `double` — a decimal number (motor power, distance in meters)\n- `int` — a whole number (sensor counts, button IDs)\n- `boolean` — `true` or `false` (is a limit switch pressed?)\n\nThe name comes after the type, then `=` assigns the starting value.",
    },
    {
      type: "callout",
      tone: "tip",
      md: "Motor power in WPILib is always a `double` between `-1.0` (full reverse) and `1.0` (full forward). `0.0` is stopped.",
    },
    {
      type: "text",
      md: "You can change a variable after declaring it — just assign a new value (without repeating the type):",
    },
    {
      type: "code",
      lang: "java",
      code: "double speed = 0.5;\nspeed = 0.75;   // ramp up\nspeed = 0.0;    // stop",
    },
    {
      type: "quiz",
      question: "Which type should hold a motor power value like 0.65?",
      options: ["int", "double", "boolean", "ticks"],
      answerIndex: 1,
      explanation:
        "Motor power is a decimal between -1.0 and 1.0, so it must be a `double`. An `int` would throw away the decimal and round to 0 or 1.",
    },
    {
      type: "text",
      md: "Two more things you'll lean on constantly:\n\n- **Naming** uses `camelCase` in Java — `maxSpeed`, not `max_speed` or `MaxSpeed`. Good names describe the value: `targetAngle`, `intakeSpeed`.\n- **Constants** that never change are marked `final` and usually written in `UPPER_SNAKE_CASE`. Teams keep tuning numbers here so they're easy to find.",
    },
    {
      type: "code",
      lang: "java",
      caption: "A tuning constant vs a changing variable",
      code: "static final double MAX_DRIVE_SPEED = 0.85;  // never reassigned\ndouble currentSpeed = 0.0;                    // updated every loop",
    },
    {
      type: "callout",
      tone: "warn",
      md: "Mixing up `int` and `double` is a classic bug. `3 / 2` is `1` in Java (integer division!), but `3.0 / 2` is `1.5`. If a value can be fractional, make sure at least one side is a `double`.",
    },
    {
      type: "quiz",
      question: "What is the value of `x` after `int x = 7 / 2;`?",
      options: ["3.5", "3", "4", "It won't compile"],
      answerIndex: 1,
      explanation:
        "Both operands are `int`, so Java does integer division and throws away the remainder: 7 / 2 = 3. To get 3.5 you'd need `double x = 7.0 / 2;`.",
    },
    {
      type: "coding",
      prompt:
        "Declare a `double` named `maxSpeed` set to `0.8`, and a `boolean` named `brakeMode` set to `true`.",
      starter: "// Declare your two variables here\n",
      solution: "double maxSpeed = 0.8;\nboolean brakeMode = true;",
      checks: [
        { label: "Declares a double named maxSpeed", pattern: "double\\s+maxSpeed\\s*=" },
        { label: "maxSpeed is set to 0.8", pattern: "maxSpeed\\s*=\\s*0\\.8" },
        { label: "Declares a boolean named brakeMode", pattern: "boolean\\s+brakeMode\\s*=" },
        { label: "brakeMode is set to true", pattern: "brakeMode\\s*=\\s*true" },
      ],
      hint: "Each line is: type, then name, then `=`, then the value, ending with a semicolon.",
    },
    {
      type: "text",
      md: "**Type choice is an engineering decision, not a detail.** Three real-robot consequences:\n\n- **Integer division truncates.** In a ratio like `ticks / maxTicks`, if both sides are `int` the division happens *first* in integer math (throwing away the fraction), and only then gets widened to a `double`. This silently produces `0.0` and is one of the most common FRC control-loop bugs.\n- **`double` has finite precision.** Don't test `if (distance == 2.0)` — floating-point rounding means it may never be *exactly* 2.0. Compare with a tolerance instead.\n- **Unit discipline.** Decide your units (meters, radians, seconds) once and keep every variable consistent. Mixing degrees and radians, or inches and meters, breaks otherwise-correct math.",
    },
    {
      type: "code",
      lang: "java",
      caption: "The integer-division trap — and the fix",
      code: "int ticks = 512, maxTicks = 2048;\n\ndouble bad  = ticks / maxTicks;          // 0.0  (int math first!)\ndouble good = (double) ticks / maxTicks; // 0.25 (cast forces double math)",
    },
    {
      type: "quiz",
      question:
        "A command computes `double pct = ticks / maxTicks;` with `int ticks = 512` and `int maxTicks = 2048`. What is `pct`?",
      options: [
        "0.25 — assigning to a double makes the division use double math",
        "0.0 — the int ÷ int evaluates to 0 first, then is widened to 0.0",
        "0.25 — Java rounds integer division to the nearest hundredth",
        "It won't compile — an int result can't be stored in a double",
      ],
      answerIndex: 1,
      explanation:
        "The right-hand side is evaluated before the assignment. Both operands are `int`, so `512 / 2048` is integer division = 0, which is then widened to `0.0`. Casting one operand first — `(double) ticks / maxTicks` — forces real division and yields 0.25.",
    },
    {
      type: "coding",
      prompt:
        "Joysticks never rest at exactly zero. Write `applyDeadband(double value, double band)` that returns `0.0` when the magnitude of `value` is below `band`, and otherwise returns `value` unchanged.",
      starter:
        "public double applyDeadband(double value, double band) {\n    // return 0.0 inside the deadband, otherwise return value\n}",
      solution:
        "public double applyDeadband(double value, double band) {\n    if (Math.abs(value) < band) {\n        return 0.0;\n    }\n    return value;\n}",
      checks: [
        { label: "Takes the magnitude with Math.abs(value)", pattern: "Math\\.abs\\(\\s*value\\s*\\)" },
        { label: "Compares the magnitude against band", pattern: "Math\\.abs\\(\\s*value\\s*\\)\\s*<\\s*band" },
        { label: "Returns 0 inside the deadband", pattern: "return\\s+0(\\.0)?\\s*;" },
        { label: "Returns value outside the deadband", pattern: "return\\s+value\\s*;" },
      ],
      hint: "`if (Math.abs(value) < band) { return 0.0; }` then, after the if, `return value;`.",
      tests: [
        { method: "applyDeadband", args: [0.05, 0.1], expected: 0.0 },
        { method: "applyDeadband", args: [-0.08, 0.1], expected: 0.0 },
        { method: "applyDeadband", args: [0.5, 0.1], expected: 0.5 },
        { method: "applyDeadband", args: [-0.9, 0.1], expected: -0.9 },
        { method: "applyDeadband", args: [0.1, 0.1], expected: 0.1 },
      ],
    },
    {
      type: "text",
      md: "**Sensors don't speak meters — you convert.** A drivetrain encoder reports *ticks* (or motor rotations). To turn that into a distance your control code can use, you chain unit conversions:\n\n`revolutions = ticks / ticksPerRevolution`\n\n`distance = revolutions × (π × wheelDiameter)`\n\nbecause one wheel revolution moves the robot exactly one wheel circumference (`π × d`). This single calculation underpins odometry, autonomous driving, and every distance-based command — and it's where the integer-division trap bites hardest, since `ticks` and `ticksPerRevolution` are both `int`.",
    },
    {
      type: "callout",
      tone: "warn",
      md: "Pick units once and never mix them. WPILib's newer APIs standardize on **meters, radians, and seconds**. A constant like `WHEEL_DIAMETER = 0.1016` (a 4-inch wheel in meters) belongs in one place, documented — a unit mistake here makes the robot drive the wrong distance with code that looks perfectly correct.",
    },
    {
      type: "coding",
      prompt:
        "Write `double ticksToMeters(int ticks, int ticksPerRev, double wheelDiameter)` that converts an encoder reading to meters of travel. Compute revolutions as `ticks / ticksPerRev` (watch the integer-division trap!), then multiply by the wheel circumference `π × wheelDiameter`.",
      starter:
        "public double ticksToMeters(int ticks, int ticksPerRev, double wheelDiameter) {\n    // 1) revolutions = ticks / ticksPerRev  (force double division!)\n    // 2) return revolutions * circumference\n}",
      solution:
        "public double ticksToMeters(int ticks, int ticksPerRev, double wheelDiameter) {\n    double revolutions = (double) ticks / ticksPerRev;\n    return revolutions * Math.PI * wheelDiameter;\n}",
      checks: [
        { label: "Declares ticksToMeters(int, int, double)", pattern: "double\\s+ticksToMeters\\s*\\(" },
        { label: "Forces double division with a cast", pattern: "\\(\\s*double\\s*\\)\\s*ticks" },
        { label: "Uses the circumference (π × diameter)", pattern: "Math\\.PI\\s*\\*\\s*wheelDiameter|wheelDiameter\\s*\\*\\s*Math\\.PI" },
      ],
      hint: "Cast first: `double revolutions = (double) ticks / ticksPerRev;` then `return revolutions * Math.PI * wheelDiameter;`. Without the cast, `ticks / ticksPerRev` is integer division and returns 0 for any partial revolution.",
      tests: [
        { method: "ticksToMeters", args: [2048, 2048, 0.1016], expected: 0.31919, tolerance: 1e-4 },
        { method: "ticksToMeters", args: [1024, 2048, 0.1016], expected: 0.159593, tolerance: 1e-4 },
        { method: "ticksToMeters", args: [0, 2048, 0.1016], expected: 0.0 },
        { method: "ticksToMeters", args: [4096, 2048, 0.1016], expected: 0.638372, tolerance: 1e-4 },
      ],
    },
  ],
};

const loops: Lesson = {
  id: "loops",
  difficulty: "Easy",
  title: "Loops & the Periodic Model",
  blurb: "Repetition is the robot's heartbeat — and why a blocking loop is a safety bug.",
  minutes: 14,
  blocks: [
    {
      type: "text",
      md: "A **loop** repeats a block of code. This is fundamental to robots: your code does not run once and stop — it runs ~50 times per second, reading sensors and updating motors. That repetition *is* a loop, managed for you by WPILib.",
    },
    {
      type: "text",
      md: "A `for` loop repeats a fixed number of times. Useful when you have several identical devices, like the four modules on a swerve drive:",
    },
    {
      type: "code",
      lang: "java",
      caption: "Stop all four swerve modules",
      code: "for (int i = 0; i < 4; i++) {\n    modules[i].stop();\n}",
    },
    {
      type: "text",
      md: "Read it as: start `i` at 0, keep going while `i < 4`, and add 1 to `i` each time (`i++`). The body runs for `i = 0, 1, 2, 3` — four times.",
    },
    {
      type: "callout",
      tone: "info",
      md: "WPILib's `robotPeriodic()` method is essentially an infinite loop the framework runs for you, about every 20 milliseconds. You write what happens *inside* one tick.",
    },
    {
      type: "text",
      md: "A `while` loop repeats as long as a condition stays true:",
    },
    {
      type: "code",
      lang: "java",
      code: "while (!limitSwitch.get()) {\n    arm.set(0.2);   // raise until the switch is pressed\n}\narm.set(0.0);",
    },
    {
      type: "callout",
      tone: "warn",
      md: "Never put a long `while` loop inside `robotPeriodic()`. It blocks the robot from reading new sensor data. In real robot code you use the periodic loop itself, not a blocking `while`.",
    },
    {
      type: "quiz",
      question: "How many times does `for (int i = 0; i < 4; i++)` run its body?",
      options: ["3", "4", "5", "Forever"],
      answerIndex: 1,
      explanation:
        "It runs for i = 0, 1, 2, 3 and stops when i reaches 4 (because 4 < 4 is false). That is 4 iterations.",
    },
    {
      type: "text",
      md: "There's a third loop you'll meet often: the **for-each** loop, which walks through every item in a collection without an index. It reads cleanly when you don't care about position:",
    },
    {
      type: "code",
      lang: "java",
      caption: "for-each over a list of motors",
      code: "for (PWMSparkMax motor : driveMotors) {\n    motor.set(0.0);   // stop every drive motor\n}",
    },
    {
      type: "callout",
      tone: "tip",
      md: "**Off-by-one** errors are the most common loop bug. `i < 4` runs 4 times (0–3); `i <= 4` runs 5 times (0–4). When something repeats one too many or one too few times, check the comparison first.",
    },
    {
      type: "quiz",
      question:
        "What happens if you put `while (true) { drive.arcadeDrive(0.5, 0); }` inside `teleopPeriodic()`?",
      options: [
        "The robot drives forward once, then stops",
        "It loops forever and blocks the robot from reading new inputs",
        "It throws a compile error",
        "Nothing — WPILib ignores while loops",
      ],
      answerIndex: 1,
      explanation:
        "An unbounded `while (true)` never returns control to WPILib, so sensors and the driver station stop updating. The periodic method itself is the loop — you don't add your own infinite loop inside it.",
    },
    {
      type: "coding",
      prompt:
        "Complete the loop so it stops all 4 swerve modules — call `modules[i].stop()` for i = 0 through 3.",
      starter: "for (int i = 0; i < 4; i++) {\n    // call stop() on modules[i]\n}",
      solution: "for (int i = 0; i < 4; i++) {\n    modules[i].stop();\n}",
      checks: [
        { label: "Loops from 0 while i < 4", pattern: "for\\s*\\(\\s*int\\s+i\\s*=\\s*0\\s*;\\s*i\\s*<\\s*4" },
        { label: "Increments the counter", pattern: "i\\+\\+" },
        { label: "Calls stop() on modules[i]", pattern: "modules\\[\\s*i\\s*\\]\\.stop\\(\\s*\\)" },
      ],
      hint: "The body goes between the braces: `modules[i].stop();`",
    },
    {
      type: "text",
      md: "**On a robot, *which* loop you use is a safety decision.** WPILib already runs a loop for you (`robotPeriodic` every 20 ms). Your job is to do a *small, bounded* amount of work each tick and return quickly. A `for` loop over a fixed array (four swerve modules) is fine — it ends. A `while` loop that waits for a condition is dangerous inside periodic code: until it exits, the framework can't read new sensor data, can't update the motor-safety watchdog, and can't respond to the driver station.",
    },
    {
      type: "callout",
      tone: "warn",
      md: "A blocking `while` inside `robotPeriodic()` re-reads the *same* stale sensor value forever (because the code that refreshes it never runs) and starves the motor-safety watchdog — a classic cause of a robot that won't stop. For 'do X until Y', use the periodic loop itself plus an `isFinished()` check, which you'll meet in the Commands lesson.",
    },
    {
      type: "quiz",
      question:
        "You add `while (gyro.getAngle() < 90) { drive.arcade(0, 0.3); }` inside `robotPeriodic()`. What actually happens?",
      options: [
        "The robot smoothly turns to 90° once per loop, then continues",
        "The loop never returns control, so sensors and the motor-safety watchdog stop updating — the robot can become unresponsive and run away",
        "WPILib safely runs the while loop on a background thread",
        "The robot rotates exactly 0.3° each time the method is called",
      ],
      answerIndex: 1,
      explanation:
        "The `while` blocks `robotPeriodic()` from returning. The gyro value it tests is never refreshed (that update can't run), the watchdog isn't fed, and the driver station is ignored. The correct pattern is a non-blocking command with `isFinished()`.",
    },
    {
      type: "coding",
      prompt:
        "Average the four swerve module positions. Loop over `positions` (a `double[]`), accumulate the total, and return the mean. Use `positions.length` rather than a hard-coded 4.",
      starter:
        "public double averagePosition(double[] positions) {\n    // sum every element, then return the average\n}",
      solution:
        "public double averagePosition(double[] positions) {\n    double sum = 0;\n    for (int i = 0; i < positions.length; i++) {\n        sum += positions[i];\n    }\n    return sum / positions.length;\n}",
      checks: [
        { label: "Initializes a running sum to 0", pattern: "double\\s+sum\\s*=\\s*0" },
        { label: "Loops across positions.length", pattern: "for\\s*\\(.*positions\\.length" },
        { label: "Accumulates each element", pattern: "sum\\s*\\+=\\s*positions\\[\\s*i\\s*\\]" },
        { label: "Returns sum divided by the count", pattern: "return\\s+sum\\s*/\\s*positions\\.length" },
      ],
      hint: "Declare `double sum = 0;`, add `positions[i]` inside the loop, then `return sum / positions.length;`.",
      tests: [
        { method: "averagePosition", args: [[1.0, 2.0, 3.0, 4.0]], expected: 2.5 },
        { method: "averagePosition", args: [[0.0, 0.0, 0.0, 0.0]], expected: 0.0 },
        { method: "averagePosition", args: [[5.0]], expected: 5.0 },
        { method: "averagePosition", args: [[-2.0, 2.0]], expected: 0.0 },
      ],
    },
    {
      type: "text",
      md: "Here's a loop that does real work on a swerve drive. When you ask all four modules for their speeds, the math can hand back values above `1.0` — but a motor caps at `1.0`, so if you just clip them the robot drives the *wrong direction* (the ratios between modules break). The fix is **desaturation**: find the largest-magnitude speed, and if it exceeds `1.0`, divide *every* speed by it so the whole set scales down together and the direction is preserved. The first step — scanning the array for the maximum absolute value — is a loop with a running accumulator, just like a sum.",
    },
    {
      type: "coding",
      prompt:
        "Write `double maxAbs(double[] speeds)` that returns the largest absolute value in the array — the first half of swerve desaturation. Track a running maximum across the loop using `Math.abs`.",
      starter:
        "public double maxAbs(double[] speeds) {\n    double max = 0;\n    // scan every element; keep the largest magnitude\n}",
      solution:
        "public double maxAbs(double[] speeds) {\n    double max = 0;\n    for (int i = 0; i < speeds.length; i++) {\n        if (Math.abs(speeds[i]) > max) {\n            max = Math.abs(speeds[i]);\n        }\n    }\n    return max;\n}",
      checks: [
        { label: "Initializes a running max", pattern: "double\\s+max\\s*=\\s*0" },
        { label: "Loops across speeds.length", pattern: "for\\s*\\(.*speeds\\.length" },
        { label: "Compares magnitudes with Math.abs", pattern: "Math\\.abs\\(\\s*speeds\\[\\s*i\\s*\\]\\s*\\)\\s*>\\s*max" },
        { label: "Returns the maximum", pattern: "return\\s+max" },
      ],
      hint: "Inside the loop: `if (Math.abs(speeds[i]) > max) { max = Math.abs(speeds[i]); }`, then `return max;` after the loop.",
      tests: [
        { method: "maxAbs", args: [[0.3, -0.9, 0.5, 1.2]], expected: 1.2 },
        { method: "maxAbs", args: [[0.1, 0.2]], expected: 0.2 },
        { method: "maxAbs", args: [[-3.0, 1.0]], expected: 3.0 },
        { method: "maxAbs", args: [[0.0]], expected: 0.0 },
      ],
    },
  ],
};

const functions: Lesson = {
  id: "functions",
  difficulty: "Easy",
  title: "Functions (Methods)",
  blurb: "Package robot actions into reusable methods — and build a real input-shaping pipeline.",
  minutes: 14,
  blocks: [
    {
      type: "text",
      md: "A **function** (called a **method** in Java) is a named block of code you can run on demand. Instead of repeating the same motor logic everywhere, you wrap it in a method and call it by name.",
    },
    {
      type: "code",
      lang: "java",
      caption: "A method that drives the robot forward",
      code: "public void driveForward(double power) {\n    leftMotor.set(power);\n    rightMotor.set(power);\n}",
    },
    {
      type: "text",
      md: "Breaking down the pieces:\n\n- `public` — who can call it (we will cover access later)\n- `void` — the **return type**; `void` means it gives nothing back\n- `driveForward` — the name\n- `(double power)` — a **parameter**, an input you pass in",
    },
    {
      type: "text",
      md: "Now driving forward is one readable line wherever you need it:",
    },
    {
      type: "code",
      lang: "java",
      code: "driveForward(0.5);   // half speed\ndriveForward(0.0);   // stop",
    },
    {
      type: "text",
      md: "Methods can also **return** a value. Replace `void` with the type you hand back, and use the `return` keyword:",
    },
    {
      type: "code",
      lang: "java",
      code: "public double getAverageDistance() {\n    return (leftEncoder.getDistance() + rightEncoder.getDistance()) / 2.0;\n}",
    },
    {
      type: "callout",
      tone: "tip",
      md: "Good method names read like actions: `driveForward`, `raiseArm`, `getAverageDistance`. If you can't name it clearly, it's probably doing too much.",
    },
    {
      type: "quiz",
      question: "What does the `void` keyword mean in a method signature?",
      options: [
        "The method takes no parameters",
        "The method returns no value",
        "The method is empty",
        "The method runs forever",
      ],
      answerIndex: 1,
      explanation:
        "`void` is the return type. It means the method performs an action but does not hand a value back to the caller. A method can still take parameters even if it returns void.",
    },
    {
      type: "text",
      md: "Methods can take **multiple parameters**, separated by commas. This is how `arcadeDrive` accepts both a speed and a turn. The order you list them is the order callers must pass them in:",
    },
    {
      type: "code",
      lang: "java",
      code: "public void setSpeeds(double left, double right) {\n    leftMotor.set(left);\n    rightMotor.set(right);\n}\n\nsetSpeeds(0.5, 0.3);   // left = 0.5, right = 0.3",
    },
    {
      type: "callout",
      tone: "tip",
      md: "A method should do **one** thing. If `driveForward` also raises the arm and reads vision, it's three methods wearing a trenchcoat. Small, single-purpose methods are easier to test and reuse.",
    },
    {
      type: "quiz",
      question: "A method declared `public boolean atTarget()` must do what?",
      options: [
        "Print true or false",
        "Return a boolean value with the `return` keyword",
        "Take a boolean parameter",
        "Nothing — boolean methods may skip returning",
      ],
      answerIndex: 1,
      explanation:
        "Any method whose return type isn't `void` must `return` a value of that type on every path. `atTarget()` must return `true` or `false`.",
    },
    {
      type: "coding",
      prompt:
        "Write a method `public void stop()` that stops the robot by setting both `leftMotor` and `rightMotor` to 0.",
      starter: "// Write the stop() method below\n",
      solution: "public void stop() {\n    leftMotor.set(0);\n    rightMotor.set(0);\n}",
      checks: [
        { label: "Declares public void stop()", pattern: "public\\s+void\\s+stop\\s*\\(\\s*\\)" },
        { label: "Stops the left motor", pattern: "leftMotor\\.set\\(\\s*0" },
        { label: "Stops the right motor", pattern: "rightMotor\\.set\\(\\s*0" },
      ],
      hint: "Signature first: `public void stop() {`, then two `.set(0)` calls, then a closing brace.",
    },
    {
      type: "text",
      md: "**Java passes primitives by value** — a method receives a *copy* of the number, not the caller's variable. Reassigning a parameter inside a method changes only the copy. This trips up beginners who expect a method to modify a value in place: it can't, for a `double` or `int`. If you want the result, the method must `return` it and the caller must store it.",
    },
    {
      type: "code",
      lang: "java",
      caption: "Reassigning a parameter does nothing to the caller",
      code: "void halve(double power) { power = power * 0.5; }   // no effect outside\ndouble better(double power) { return power * 0.5; }  // usable result\n\ndouble p = 0.8;\nhalve(p);          // p is still 0.8\np = better(p);     // now p is 0.4",
    },
    {
      type: "quiz",
      question:
        "Given `void scale(double power) { power = power * 0.5; }`, what is `p` after `double p = 0.8; scale(p);`?",
      options: [
        "0.4 — scale() halved the value",
        "0.8 — Java passes the primitive by value, so reassigning the parameter doesn't touch the caller's variable",
        "0.0 — the parameter is reset to zero",
        "It throws a runtime error",
      ],
      answerIndex: 1,
      explanation:
        "`power` is a copy of `p`. Reassigning it inside `scale` changes only the copy, so `p` stays 0.8. To use the halved value you'd need `double scale(double power) { return power * 0.5; }` and `p = scale(p);`.",
    },
    {
      type: "coding",
      prompt:
        "Motor outputs must stay in [-1.0, 1.0]. Write `clamp(double value)` that returns `1.0` if value exceeds 1.0, `-1.0` if it's below -1.0, and otherwise returns `value` unchanged.",
      starter:
        "public double clamp(double value) {\n    // limit value to the range [-1.0, 1.0]\n}",
      solution:
        "public double clamp(double value) {\n    if (value > 1.0) {\n        return 1.0;\n    }\n    if (value < -1.0) {\n        return -1.0;\n    }\n    return value;\n}",
      checks: [
        { label: "Tests the upper bound (> 1.0)", pattern: "value\\s*>\\s*1(\\.0)?" },
        { label: "Returns 1.0 when too high", pattern: "return\\s+1\\.0" },
        { label: "Tests the lower bound (< -1.0)", pattern: "value\\s*<\\s*-\\s*1(\\.0)?" },
        { label: "Returns -1.0 when too low", pattern: "return\\s+-\\s*1\\.0" },
        { label: "Returns value when in range", pattern: "return\\s+value\\s*;" },
      ],
      hint: "Two guard clauses: `if (value > 1.0) return 1.0;` and `if (value < -1.0) return -1.0;`, then `return value;`.",
      tests: [
        { method: "clamp", args: [1.5], expected: 1.0 },
        { method: "clamp", args: [-2.0], expected: -1.0 },
        { method: "clamp", args: [0.3], expected: 0.3 },
        { method: "clamp", args: [1.0], expected: 1.0 },
        { method: "clamp", args: [-1.0], expected: -1.0 },
      ],
    },
    {
      type: "text",
      md: "A naive deadband has a hidden flaw: the instant the stick crosses the band, output **jumps** from 0 to `band` (e.g. 0.0 → 0.1). The driver feels a lurch. Real teams **rescale** the surviving range so output rises smoothly from 0 at the band edge to 1.0 at full stick:\n\n`output = (value − sign(value)·band) / (1 − band)`\n\nThis is *input shaping* — composing the small methods you just wrote (`Math.abs`, sign handling, the deadband idea) into one continuous transfer function. It's the exact preprocessing that sits between a joystick and `arcadeDrive`.",
    },
    {
      type: "coding",
      prompt:
        "Write `double processInput(double value, double band)`: return `0.0` inside the deadband, otherwise return the rescaled value `(value − Math.signum(value)·band) / (1.0 − band)` so output is continuous from the band edge (0) to full stick (±1).",
      starter:
        "public double processInput(double value, double band) {\n    if (Math.abs(value) < band) {\n        return 0.0;\n    }\n    // rescale the surviving range so there's no jump at the edge\n}",
      solution:
        "public double processInput(double value, double band) {\n    if (Math.abs(value) < band) {\n        return 0.0;\n    }\n    return (value - Math.signum(value) * band) / (1.0 - band);\n}",
      checks: [
        { label: "Declares processInput(double, double)", pattern: "double\\s+processInput\\s*\\(" },
        { label: "Zeros out inside the deadband", pattern: "Math\\.abs\\(\\s*value\\s*\\)\\s*<\\s*band" },
        { label: "Uses Math.signum for the sign", pattern: "Math\\.signum\\(\\s*value\\s*\\)" },
        { label: "Divides by (1.0 - band) to rescale", pattern: "/\\s*\\(\\s*1(\\.0)?\\s*-\\s*band\\s*\\)" },
      ],
      hint: "After the deadband guard: `return (value - Math.signum(value) * band) / (1.0 - band);`. At value=band the numerator is 0; at value=1 it's (1-band), divided by (1-band) = 1.",
      tests: [
        { method: "processInput", args: [0.05, 0.1], expected: 0.0 },
        { method: "processInput", args: [1.0, 0.1], expected: 1.0, tolerance: 1e-9 },
        { method: "processInput", args: [0.55, 0.1], expected: 0.5, tolerance: 1e-9 },
        { method: "processInput", args: [-1.0, 0.1], expected: -1.0, tolerance: 1e-9 },
        { method: "processInput", args: [-0.55, 0.1], expected: -0.5, tolerance: 1e-9 },
      ],
    },
  ],
};

const classes: Lesson = {
  id: "classes",
  difficulty: "Medium",
  title: "Classes & Objects",
  blurb: "Model real robot parts as code objects you can control.",
  minutes: 16,
  blocks: [
    {
      type: "text",
      md: "A **class** is a blueprint that bundles together related data (variables) and behavior (methods). An **object** is one real thing built from that blueprint. This maps perfectly onto a robot: your robot *has* an arm, a drivetrain, an intake — each is naturally its own class.",
    },
    {
      type: "code",
      lang: "java",
      caption: "A class modeling a robot arm",
      code: "public class Arm {\n    private Motor motor = new Motor(5);\n    private boolean raised = false;\n\n    public void raise() {\n        motor.set(0.4);\n        raised = true;\n    }\n\n    public void lower() {\n        motor.set(-0.4);\n        raised = false;\n    }\n\n    public boolean isRaised() {\n        return raised;\n    }\n}",
    },
    {
      type: "text",
      md: "The `Arm` class keeps its `motor` and `raised` state inside, and exposes `raise()`, `lower()`, and `isRaised()` as the only ways to interact with it. The rest of your code never touches the motor directly — it just says `arm.raise()`.",
    },
    {
      type: "callout",
      tone: "info",
      md: "`private` hides a variable inside the class. This is **encapsulation** — the cornerstone of WPILib's command-based framework, where each subsystem owns its hardware and nobody else can poke at it.",
    },
    {
      type: "text",
      md: "You create an object with `new`, then call its methods with a dot:",
    },
    {
      type: "code",
      lang: "java",
      code: "Arm arm = new Arm();\narm.raise();\nif (arm.isRaised()) {\n    System.out.println(\"Arm is up!\");\n}",
    },
    {
      type: "quiz",
      question: "Why mark the `motor` field `private`?",
      options: [
        "So it runs faster",
        "So only the Arm class can control it, keeping hardware logic in one place",
        "So it uses less memory",
        "Because motors must always be private in Java",
      ],
      answerIndex: 1,
      explanation:
        "`private` enforces encapsulation: only the Arm decides how its motor moves. This prevents bugs where two parts of the code fight over the same motor — exactly what command-based subsystems are designed to prevent.",
    },
    {
      type: "text",
      md: "A **constructor** is a special method that runs once when you create an object with `new`. It's where you set up the object's starting state — assign ports, reset sensors, configure motors:",
    },
    {
      type: "code",
      lang: "java",
      caption: "A constructor takes the motor port as input",
      code: "public class Arm {\n    private final Motor motor;\n\n    public Arm(int port) {     // constructor\n        motor = new Motor(port);\n    }\n}\n\nArm arm = new Arm(5);   // builds an Arm on port 5",
    },
    {
      type: "callout",
      tone: "info",
      md: "Notice a class can have many objects, each with its own state. `new Arm(5)` and `new Arm(6)` are two independent arms — changing one never touches the other.",
    },
    {
      type: "quiz",
      question: "What is the difference between a class and an object?",
      options: [
        "Nothing — they're two words for the same thing",
        "A class is a blueprint; an object is a specific instance built from it",
        "A class is faster; an object is slower",
        "An object is a blueprint; a class is the instance",
      ],
      answerIndex: 1,
      explanation:
        "A class defines structure and behavior once. Each `new ClassName()` creates an object — a concrete instance with its own copy of the fields.",
    },
    {
      type: "coding",
      prompt:
        "Complete the `Intake` class: add a `private boolean running` field, and a `public void start()` method that sets `running` to `true` and calls `motor.set(0.7)`.",
      starter:
        "public class Intake {\n    private Motor motor = new Motor(7);\n    // add the running field here\n\n    // add the start() method here\n}",
      solution:
        "public class Intake {\n    private Motor motor = new Motor(7);\n    private boolean running = false;\n\n    public void start() {\n        running = true;\n        motor.set(0.7);\n    }\n}",
      checks: [
        { label: "Declares a private boolean running", pattern: "private\\s+boolean\\s+running" },
        { label: "start() is public and void", pattern: "public\\s+void\\s+start\\s*\\(\\s*\\)" },
        { label: "Sets running to true", pattern: "running\\s*=\\s*true" },
        { label: "Runs the motor at 0.7", pattern: "motor\\.set\\(\\s*0\\.7" },
      ],
      hint: "Field: `private boolean running = false;`. Inside start(), set the flag then call `motor.set(0.7);`.",
    },
    {
      type: "text",
      md: "**Objects behave differently from primitives: they're handled by *reference*.** A variable doesn't hold the object itself — it holds a reference to where the object lives. Assigning one object variable to another copies the *reference*, so both now point at the *same* object. This is why two parts of your code can accidentally fight over one motor, and exactly why subsystems exist to give each piece of hardware a single owner.",
    },
    {
      type: "code",
      lang: "java",
      caption: "Two references, one object",
      code: "Arm a = new Arm();\nArm b = a;       // b references the SAME arm as a\nb.raise();       // a.isRaised() is now true, too\n\n// contrast: primitives copy the value\nint x = 5;\nint y = x;       // y is a separate copy\ny = 9;           // x is still 5",
    },
    {
      type: "quiz",
      question: "After `Arm a = new Arm(); Arm b = a; b.raise();`, what is true of `a`?",
      options: [
        "a is unaffected — b is an independent copy of the arm",
        "a is also raised, because a and b reference the same object",
        "It won't compile — objects can't be assigned to each other",
        "a becomes null once b is modified",
      ],
      answerIndex: 1,
      explanation:
        "`b = a` copies the reference, not the object. Both variables point to one `Arm`, so calling `raise()` through `b` raises the same arm `a` sees. Primitives, by contrast, copy their value.",
    },
    {
      type: "coding",
      prompt:
        "Add a `toggle()` method to the Arm: if the arm is currently raised, lower it; otherwise raise it. Reuse the existing `isRaised()`, `raise()`, and `lower()` methods rather than touching the motor directly.",
      starter: "public void toggle() {\n    // lower if currently raised, otherwise raise\n}",
      solution:
        "public void toggle() {\n    if (isRaised()) {\n        lower();\n    } else {\n        raise();\n    }\n}",
      checks: [
        { label: "Checks current state via isRaised()", pattern: "isRaised\\(\\s*\\)" },
        { label: "Lowers when currently raised", pattern: "lower\\(\\s*\\)" },
        { label: "Raises otherwise", pattern: "raise\\(\\s*\\)" },
      ],
      hint: "`if (isRaised()) { lower(); } else { raise(); }` — let the existing methods do the work.",
    },
    {
      type: "text",
      md: "Most real robot state isn't a single yes/no flag — it's a value the object must **keep valid for itself**. An elevator has a discrete height level; nothing outside the class should be able to shove it past its top stop or below the floor. The class enforces those limits internally, every time, so no caller can put the hardware in an impossible state. That self-protecting state is exactly what a WPILib subsystem provides for its mechanism.",
    },
    {
      type: "callout",
      tone: "tip",
      md: "Mark fields `final` when they're set once at construction and never reassigned — like a port number or a max height. The compiler then guarantees nobody mutates them later, turning a class of bugs into a compile error.",
    },
    {
      type: "quiz",
      question:
        "Your elevator overshoots its top hard stop and bends a bracket. The `up()` method just did `position += 1` with no check. Where does the fix belong?",
      options: [
        "In every command that calls up(), add an if-check before calling it",
        "Inside the Elevator class, so up() itself refuses to exceed the max — one owner, one guarantee",
        "Add a comment telling drivers not to hold the up button",
        "Make position public so callers can clamp it themselves",
      ],
      answerIndex: 1,
      explanation:
        "Encapsulation means the limit lives with the state it protects. If `up()` enforces the max itself, the guarantee holds no matter who calls it or how often. Pushing the check onto every caller (or exposing the field) is how two code paths end up disagreeing and the bracket bends.",
    },
    {
      type: "coding",
      prompt:
        "Build an `Elevator` that protects its own state. It tracks an integer `position` (starts at 0) up to `maxLevel` (set in the constructor). Implement `up()` to raise one level but never above `maxLevel`, `down()` to lower one level but never below 0, and `atTop()` to return whether it's at `maxLevel`. The tests drive one elevator through a sequence — including over-pressing past the limits.",
      starter:
        "public class Elevator {\n    private int position = 0;\n    private final int maxLevel;\n\n    public Elevator(int maxLevel) {\n        this.maxLevel = maxLevel;\n    }\n\n    public void up() {\n        // raise one level, but never above maxLevel\n    }\n\n    public void down() {\n        // lower one level, but never below 0\n    }\n\n    public int getPosition() {\n        return position;\n    }\n\n    public boolean atTop() {\n        // true when at the highest level\n    }\n}",
      solution:
        "public class Elevator {\n    private int position = 0;\n    private final int maxLevel;\n\n    public Elevator(int maxLevel) {\n        this.maxLevel = maxLevel;\n    }\n\n    public void up() {\n        if (position < maxLevel) {\n            position += 1;\n        }\n    }\n\n    public void down() {\n        if (position > 0) {\n            position -= 1;\n        }\n    }\n\n    public int getPosition() {\n        return position;\n    }\n\n    public boolean atTop() {\n        return position == maxLevel;\n    }\n}",
      checks: [
        { label: "up() clamps against maxLevel", pattern: "position\\s*<\\s*maxLevel" },
        { label: "down() clamps against 0", pattern: "position\\s*>\\s*0" },
        { label: "atTop() compares position to maxLevel", pattern: "position\\s*==\\s*maxLevel" },
      ],
      hint: "Guard each move: `if (position < maxLevel) { position += 1; }` and `if (position > 0) { position -= 1; }`. `atTop()` is just `return position == maxLevel;`.",
      stateTests: [
        {
          className: "Elevator",
          ctorArgs: [3],
          label: "drive the elevator, including over-pressing the limits",
          steps: [
            { method: "up", args: [] },
            { method: "getPosition", args: [], expected: 1, label: "one level up → 1" },
            { method: "up", args: [] },
            { method: "up", args: [] },
            { method: "getPosition", args: [], expected: 3, label: "raised to the top → 3" },
            { method: "atTop", args: [], expected: true, label: "atTop() → true" },
            { method: "up", args: [] },
            { method: "getPosition", args: [], expected: 3, label: "up() past the top clamps → still 3" },
            { method: "down", args: [] },
            { method: "getPosition", args: [], expected: 2, label: "down one → 2" },
            { method: "atTop", args: [], expected: false, label: "no longer at top → false" },
          ],
        },
      ],
    },
  ],
};

const javaBasics: Lesson = {
  id: "java-basics",
  difficulty: "Easy",
  title: "Java Syntax Essentials",
  blurb: "Semicolons, braces, and the shape of every Java file.",
  minutes: 9,
  blocks: [
    {
      type: "text",
      md: "FRC robots are programmed in **Java** (or C++). A few syntax rules apply to nearly every line you'll write:\n\n- Statements end with a **semicolon** `;`\n- Blocks of code are wrapped in **braces** `{ }`\n- Java is **case-sensitive**: `Motor` and `motor` are different names",
    },
    {
      type: "code",
      lang: "java",
      caption: "The shape of a typical robot file",
      code: "public class Robot {\n\n    public void teleopPeriodic() {\n        double power = 0.5;\n        drive.arcadeDrive(power, 0.0);\n    }\n}",
    },
    {
      type: "text",
      md: "Comments are notes the computer ignores — use them to explain *why*, not *what*:",
    },
    {
      type: "code",
      lang: "java",
      code: "// single-line comment\n\n/*\n   multi-line comment,\n   handy for documenting a subsystem\n*/",
    },
    {
      type: "callout",
      tone: "warn",
      md: "A missing semicolon or unmatched brace is the #1 beginner compile error. The editor underlines it in red — read the *first* error, since later ones are often just fallout from the first.",
    },
    {
      type: "quiz",
      question: "Which line is valid Java?",
      options: [
        "double power = 0.5",
        "Double Power = 0.5;",
        "double power = 0.5;",
        "double power := 0.5;",
      ],
      answerIndex: 2,
      explanation:
        "It needs a lowercase `double` type, an `=` for assignment, and a closing semicolon. Option 2 uses `Double`/`Power` (wrong case for a primitive and convention) and option 4 uses `:=`, which isn't Java.",
    },
    {
      type: "text",
      md: "Two operators trip up beginners constantly:\n\n- `=` **assigns** a value: `speed = 0.5;`\n- `==` **compares** two values: `if (speed == 0.5)`\n\nUsing `=` where you meant `==` is a frequent bug. Java will often catch it, but not always.",
    },
    {
      type: "code",
      lang: "java",
      code: "boolean stopped = (speed == 0.0);   // compare, then store the result\nif (stopped) {\n    System.out.println(\"Robot is stopped\");\n}",
    },
    {
      type: "callout",
      tone: "info",
      md: "Java is **whitespace-insensitive** — indentation doesn't change meaning the way it does in Python. But consistent indentation is non-negotiable for readability, and your editor will auto-format it.",
    },
    {
      type: "quiz",
      question: "Which line correctly writes a single-line comment in Java?",
      options: ["# stop the motor", "// stop the motor", "<!-- stop the motor -->", "/ stop the motor"],
      answerIndex: 1,
      explanation:
        "Java single-line comments start with `//`. `#` is Python, `<!-- -->` is HTML. Block comments use `/* ... */`.",
    },
    {
      type: "coding",
      prompt:
        "The line below won't compile because it's missing something Java requires at the end of every statement. Rewrite it correctly to declare an `int` named `port` equal to `3`.",
      starter: "int port = 3",
      solution: "int port = 3;",
      checks: [
        { label: "Declares int port = 3", pattern: "int\\s+port\\s*=\\s*3" },
        { label: "Ends the statement with a semicolon", pattern: "int\\s+port\\s*=\\s*3\\s*;" },
      ],
      hint: "Every Java statement ends with a `;`.",
    },
    {
      type: "text",
      md: "**One gotcha that bites everyone: comparing text.** For objects (like `String`), `==` checks whether two variables point to the *same object*, not whether they hold the same characters. To compare contents you call `.equals()`. This matters in robot code when you read an auto-routine name from the dashboard and compare it — `==` can silently fail even when the text looks identical.",
    },
    {
      type: "code",
      lang: "java",
      caption: "== vs .equals() for Strings",
      code: "String chosen = chooser.getSelected();\n\nif (chosen == \"CenterAuto\")      { /* unreliable! */ }\nif (chosen.equals(\"CenterAuto\")) { /* correct */ }",
    },
    {
      type: "callout",
      tone: "tip",
      md: "Rule of thumb: use `==` for primitives (`int`, `double`, `boolean`), and `.equals()` for objects like `String`. Mixing them up is a silent logic bug, not a compile error — the compiler won't warn you.",
    },
    {
      type: "quiz",
      question: "Two `String` variables `a` and `b` both contain the text \"auto\". What does `a == b` actually test?",
      options: [
        "Whether they contain the same characters",
        "Whether they are the same object in memory — use a.equals(b) to compare the text",
        "It's always true whenever the text matches",
        "It won't compile for Strings",
      ],
      answerIndex: 1,
      explanation:
        "`==` compares object references, so it can be false even when the characters match. `a.equals(b)` compares the actual contents. For Strings (and objects generally), always use `.equals()`.",
    },
    {
      type: "coding",
      prompt:
        "Write `describe(double speed)` that returns the String `\"fast\"` when `speed` is greater than 0.7, and otherwise returns `\"slow\"`.",
      starter: "public String describe(double speed) {\n    // return \"fast\" when speed > 0.7, otherwise \"slow\"\n}",
      solution:
        "public String describe(double speed) {\n    if (speed > 0.7) {\n        return \"fast\";\n    }\n    return \"slow\";\n}",
      checks: [
        { label: "Tests speed > 0.7", pattern: "speed\\s*>\\s*0\\.7" },
        { label: "Returns \"fast\" when above", pattern: "return\\s+\"fast\"" },
        { label: "Returns \"slow\" otherwise", pattern: "return\\s+\"slow\"" },
      ],
      hint: "`if (speed > 0.7) { return \"fast\"; }` then `return \"slow\";`.",
      tests: [
        { method: "describe", args: [0.8], expected: "fast" },
        { method: "describe", args: [0.5], expected: "slow" },
        { method: "describe", args: [0.7], expected: "slow" },
        { method: "describe", args: [0.71], expected: "fast" },
      ],
    },
  ],
};

const wpilibIntro: Lesson = {
  id: "wpilib-intro",
  difficulty: "Easy",
  title: "What is WPILib?",
  blurb: "The library that turns Java into robot control.",
  minutes: 13,
  blocks: [
    {
      type: "text",
      md: "**WPILib** is the official software library for FRC. It gives you ready-made Java classes for everything on the robot: motors, sensors, the joystick, the driver station, even path following. You write the strategy; WPILib talks to the hardware.",
    },
    {
      type: "text",
      md: "Every robot program is built around a small set of **lifecycle methods** that WPILib calls for you at the right time:",
    },
    {
      type: "code",
      lang: "java",
      caption: "The methods WPILib calls automatically",
      code: "public void robotInit() {}      // once, on power-up\npublic void autonomousPeriodic() {} // ~50x/sec during auto\npublic void teleopPeriodic() {}     // ~50x/sec during driver control\npublic void disabledInit() {}       // when the robot is disabled",
    },
    {
      type: "callout",
      tone: "info",
      md: "`Init` methods run **once** when a mode starts. `Periodic` methods run **repeatedly** (~every 20 ms) while that mode is active. This is the loop concept you learned earlier, provided by the framework.",
    },
    {
      type: "text",
      md: "You don't call these yourself — you *fill them in*, and the framework runs them at the correct moments based on the match state and the driver station.",
    },
    {
      type: "quiz",
      question: "When does `teleopPeriodic()` run?",
      options: [
        "Once when the robot powers on",
        "Repeatedly while the robot is in driver-control mode",
        "Only when a button is pressed",
        "Once at the end of the match",
      ],
      answerIndex: 1,
      explanation:
        "`teleopPeriodic()` is called ~50 times per second for the entire teleop (driver-controlled) period. `Periodic` = repeating; `Init` = once.",
    },
    {
      type: "text",
      md: "An FRC match has distinct **modes**, and WPILib gives each one an `Init` (runs once when the mode starts) and a `Periodic` (runs repeatedly while in that mode):\n\n- **Autonomous** — the first ~15 seconds, robot runs on its own\n- **Teleop** — drivers control the robot\n- **Disabled** — motors are cut for safety between/around modes\n- **Test** — for bench testing mechanisms",
    },
    {
      type: "callout",
      tone: "info",
      md: "There's also `robotPeriodic()`, which runs in **every** mode. It's the right place for things you always want updated, like pushing sensor values to the dashboard.",
    },
    {
      type: "quiz",
      question: "Roughly how often does a `Periodic` method run?",
      options: [
        "Once per match",
        "About every 20 ms (~50 times per second)",
        "Only when a button is pressed",
        "Once per second",
      ],
      answerIndex: 1,
      explanation:
        "The default robot loop period is 20 milliseconds, so periodic methods run about 50 times every second while their mode is active.",
    },
    {
      type: "coding",
      prompt:
        "Fill in `teleopPeriodic()` so the robot arcade-drives forward at half speed with no turning.",
      starter: "public void teleopPeriodic() {\n    // drive forward at 0.5, turn 0.0\n}",
      solution: "public void teleopPeriodic() {\n    drive.arcadeDrive(0.5, 0.0);\n}",
      checks: [
        { label: "Calls drive.arcadeDrive(...)", pattern: "drive\\.arcadeDrive\\(" },
        { label: "Forward speed is 0.5", pattern: "arcadeDrive\\(\\s*0\\.5" },
        { label: "Turn rate is 0", pattern: "arcadeDrive\\(\\s*0\\.5\\s*,\\s*0" },
      ],
      hint: "One line inside the braces: `drive.arcadeDrive(0.5, 0.0);`",
    },
    {
      type: "text",
      md: "**Knowing what belongs in `Init` vs `Periodic` is half of writing correct robot code.** `Init` runs once — it's for *setup*: configuring motor inversions, setting encoder conversions, resetting the gyro. `Periodic` runs ~50×/second — it's for *control* that changes each cycle: reading the joystick and driving. Putting one-time setup in `Periodic` re-sends it constantly and can flood the CAN bus; putting control in `Init` means it runs once and never updates.",
    },
    {
      type: "callout",
      tone: "warn",
      md: "Each periodic call has a ~20 ms budget. Heavy work (long loops, big computations, slow logging) causes a **loop overrun** — the robot falls behind real time and control gets choppy. Keep periodic methods lean.",
    },
    {
      type: "quiz",
      question: "You call `motor.setInverted(true)` inside `teleopPeriodic()`. What's the problem?",
      options: [
        "Nothing — inversion has to be re-applied every loop",
        "It re-sends one-time config ~50×/sec, wasting CAN bandwidth; setup like this belongs in robotInit()",
        "Calling it 50 times inverts the motor back and forth, cancelling out",
        "It throws an exception on the second call",
      ],
      answerIndex: 1,
      explanation:
        "Motor inversion is a one-time configuration. Re-sending it every loop wastes bus bandwidth for no benefit. One-time setup belongs in an `Init` method; `Periodic` is for control that genuinely changes each cycle.",
    },
    {
      type: "coding",
      prompt:
        "Do the drivetrain's one-time setup in the right place: inside `robotInit()`, invert the right motor by calling `rightMotor.setInverted(true)`.",
      starter: "public void robotInit() {\n    // one-time setup: invert the right motor\n}",
      solution: "public void robotInit() {\n    rightMotor.setInverted(true);\n}",
      checks: [
        { label: "Inverts the right motor", pattern: "rightMotor\\.setInverted\\(\\s*true\\s*\\)" },
      ],
      hint: "`rightMotor.setInverted(true);` — and note it's in robotInit (runs once), not a periodic method.",
    },
    {
      type: "text",
      md: "Let's make the Init-once / Periodic-many split concrete by modeling it ourselves. Imagine a tiny robot object that counts how many times each lifecycle method has run. `robotInit()` should perform setup *exactly once* per power-up; `teleopPeriodic()` runs every loop. If you mistakenly put setup in the periodic method, its counter would climb past 1 — which is precisely the CAN-flooding bug from the quiz, made visible.",
    },
    {
      type: "coding",
      prompt:
        "Model a robot's lifecycle. In `robotInit()` set `inverted` to true and increment `configCount`. In `teleopPeriodic()` increment `driveCount`. The tests call robotInit once and teleopPeriodic several times, then check the counters — proving setup ran once while control ran every loop.",
      starter:
        "public class Robot {\n    private boolean inverted = false;\n    private int configCount = 0;\n    private int driveCount = 0;\n\n    public void robotInit() {\n        // one-time setup: invert, and count this configuration\n    }\n\n    public void teleopPeriodic() {\n        // per-loop control: count this drive cycle\n    }\n\n    public int getConfigCount() {\n        return configCount;\n    }\n\n    public int getDriveCount() {\n        return driveCount;\n    }\n\n    public boolean isInverted() {\n        return inverted;\n    }\n}",
      solution:
        "public class Robot {\n    private boolean inverted = false;\n    private int configCount = 0;\n    private int driveCount = 0;\n\n    public void robotInit() {\n        inverted = true;\n        configCount += 1;\n    }\n\n    public void teleopPeriodic() {\n        driveCount += 1;\n    }\n\n    public int getConfigCount() {\n        return configCount;\n    }\n\n    public int getDriveCount() {\n        return driveCount;\n    }\n\n    public boolean isInverted() {\n        return inverted;\n    }\n}",
      checks: [
        { label: "robotInit sets inverted to true", pattern: "inverted\\s*=\\s*true" },
        { label: "robotInit counts the configuration", pattern: "configCount\\s*\\+=\\s*1|configCount\\s*=\\s*configCount\\s*\\+\\s*1" },
        { label: "teleopPeriodic counts a drive cycle", pattern: "driveCount\\s*\\+=\\s*1|driveCount\\s*=\\s*driveCount\\s*\\+\\s*1" },
      ],
      hint: "robotInit: `inverted = true; configCount += 1;`. teleopPeriodic: `driveCount += 1;`.",
      stateTests: [
        {
          className: "Robot",
          ctorArgs: [],
          label: "init once, periodic many",
          steps: [
            { method: "robotInit", args: [] },
            { method: "teleopPeriodic", args: [] },
            { method: "teleopPeriodic", args: [] },
            { method: "teleopPeriodic", args: [] },
            { method: "getConfigCount", args: [], expected: 1, label: "setup ran exactly once → 1" },
            { method: "getDriveCount", args: [], expected: 3, label: "control ran every loop → 3" },
            { method: "isInverted", args: [], expected: true, label: "inversion applied → true" },
          ],
        },
      ],
    },
  ],
};

const motorsAndDrive: Lesson = {
  id: "motors-and-drive",
  difficulty: "Medium",
  title: "Motors & Driving",
  blurb: "Make the robot actually move.",
  minutes: 11,
  blocks: [
    {
      type: "text",
      md: "Time to move a robot. A **motor controller** turns a number from your code into voltage on a real motor. In WPILib you set its output with `.set(power)`, where power is that familiar `double` from `-1.0` to `1.0`.",
    },
    {
      type: "code",
      lang: "java",
      code: "PWMSparkMax leftMotor = new PWMSparkMax(0);   // plugged into PWM port 0\nPWMSparkMax rightMotor = new PWMSparkMax(1);\n\nleftMotor.set(0.5);    // half speed forward\nrightMotor.set(0.5);",
    },
    {
      type: "text",
      md: "Setting each side by hand works, but WPILib's `DifferentialDrive` does the math for a standard two-side (\"tank\") robot. **Arcade drive** is the most common control scheme: one stick axis for speed, one for turning.",
    },
    {
      type: "code",
      lang: "java",
      caption: "Arcade drive: forward speed + turn rate",
      code: "DifferentialDrive drive = new DifferentialDrive(leftMotor, rightMotor);\n\n// forward at 50%, turning right at 20%\ndrive.arcadeDrive(0.5, 0.2);",
    },
    {
      type: "callout",
      tone: "tip",
      md: "The first argument is forward/back speed, the second is rotation. `arcadeDrive(0.5, 0.0)` drives straight; `arcadeDrive(0.0, 1.0)` spins in place.",
    },
    {
      type: "text",
      md: "Wired to a joystick, you get a drivable robot in a few lines:",
    },
    {
      type: "code",
      lang: "java",
      code: "public void teleopPeriodic() {\n    double speed = -joystick.getLeftY();   // up is negative, so flip it\n    double turn = joystick.getRightX();\n    drive.arcadeDrive(speed, turn);\n}",
    },
    {
      type: "quiz",
      question: "What does `drive.arcadeDrive(0.0, 1.0)` make the robot do?",
      options: [
        "Drive straight forward",
        "Stop completely",
        "Rotate in place",
        "Drive backward",
      ],
      answerIndex: 2,
      explanation:
        "The first argument (forward speed) is 0 and the second (turn rate) is full, so the robot spins in place without translating.",
    },
    {
      type: "text",
      md: "Real robots need one more idea: **inverting** a motor. The two sides of a drivetrain face opposite directions, so sending both `0.5` would make the robot spin, not drive straight. You flip one side so positive means \"forward\" for both:",
    },
    {
      type: "code",
      lang: "java",
      code: "rightMotor.setInverted(true);   // now +power drives this side forward too",
    },
    {
      type: "callout",
      tone: "tip",
      md: "`DifferentialDrive` already handles some inversion for you, which is one reason to prefer it over setting each motor by hand. If your robot spins when you expect it to drive straight, an inversion is almost always the culprit.",
    },
    {
      type: "quiz",
      question: "What is the valid range for a value passed to a motor controller's `.set()`?",
      options: ["0 to 100", "-1.0 to 1.0", "0 to 1.0 only", "-100 to 100"],
      answerIndex: 1,
      explanation:
        "Motor output is a fraction of full power from -1.0 (full reverse) through 0.0 (stop) to 1.0 (full forward). Values outside that range are clamped.",
    },
    {
      type: "coding",
      prompt:
        "Create a `DifferentialDrive` named `drive` from the existing `left` and `right` controllers, then make the robot spin in place at full speed.",
      starter:
        "PWMSparkMax left = new PWMSparkMax(0);\nPWMSparkMax right = new PWMSparkMax(1);\n// create the drive, then spin in place\n",
      solution:
        "DifferentialDrive drive = new DifferentialDrive(left, right);\ndrive.arcadeDrive(0.0, 1.0);",
      checks: [
        { label: "Creates a DifferentialDrive from left and right", pattern: "new\\s+DifferentialDrive\\(\\s*left\\s*,\\s*right\\s*\\)" },
        { label: "Forward speed is 0", pattern: "arcadeDrive\\(\\s*0(\\.0)?\\s*," },
        { label: "Turn rate is full (1.0)", pattern: "arcadeDrive\\(\\s*0(\\.0)?\\s*,\\s*1" },
      ],
      hint: "Spinning in place means forward speed 0 and turn 1.0: `drive.arcadeDrive(0.0, 1.0);`",
    },
    {
      type: "text",
      md: "**Raw joystick → motor is rarely good enough.** Two refinements real teams add:\n\n- **Input shaping.** Mapping the stick straight through makes the robot twitchy at low speed. *Squaring* the input while preserving its sign (so -0.5 → -0.25) gives fine control near zero and full power at the extremes.\n- **Slew-rate limiting.** Slamming from 0 to full power spikes current and can **brown out** the robot (voltage sags so far the roboRIO reboots). A `SlewRateLimiter` ramps commands smoothly to protect the battery and the gearboxes.",
    },
    {
      type: "code",
      lang: "java",
      caption: "Ramp inputs to avoid current spikes",
      code: "SlewRateLimiter limiter = new SlewRateLimiter(3.0); // units/sec\n\ndouble smooth = limiter.calculate(joystick.getLeftY());\ndrive.arcadeDrive(smooth, joystick.getRightX());",
    },
    {
      type: "quiz",
      question:
        "Drivers say the robot is twitchy and hard to control precisely at low speed. Which technique most directly helps?",
      options: [
        "Inverting both drive motors",
        "Squaring the joystick input while preserving its sign, so small movements produce small outputs",
        "Allowing motor power above 1.0",
        "Calling arcadeDrive twice each loop",
      ],
      answerIndex: 1,
      explanation:
        "Sign-preserving squaring compresses small inputs (fine control near zero) while still reaching full output at the extremes — a standard driver-feel fix. WPILib's `arcadeDrive` even has a built-in option for it.",
    },
    {
      type: "coding",
      prompt:
        "Write `shape(double input)` that squares the input's magnitude but keeps its sign (so 0.5 → 0.25 and -0.5 → -0.25). Hint: multiplying a value by its absolute value does exactly this.",
      starter: "public double shape(double input) {\n    // square the magnitude, preserve the sign\n}",
      solution: "public double shape(double input) {\n    return input * Math.abs(input);\n}",
      checks: [
        { label: "Uses Math.abs(input)", pattern: "Math\\.abs\\(\\s*input\\s*\\)" },
        {
          label: "Multiplies input by its magnitude",
          pattern: "(input\\s*\\*\\s*Math\\.abs\\(\\s*input\\s*\\)|Math\\.abs\\(\\s*input\\s*\\)\\s*\\*\\s*input)",
        },
        { label: "Returns the result", pattern: "return\\s+" },
      ],
      hint: "`return input * Math.abs(input);`",
      tests: [
        { method: "shape", args: [0.5], expected: 0.25 },
        { method: "shape", args: [-0.5], expected: -0.25 },
        { method: "shape", args: [1.0], expected: 1.0 },
        { method: "shape", args: [0.0], expected: 0.0 },
        { method: "shape", args: [-0.2], expected: -0.04, tolerance: 1e-9 },
      ],
    },
    {
      type: "text",
      md: "Here's the math `DifferentialDrive` actually runs. Arcade gives a forward `speed` and a `turn`; tank needs a left and right output. The combine step is simple addition — but it can exceed `±1.0`, so it needs the same **desaturation** you met with swerve: if either side overshoots, divide *both* by the larger magnitude so the ratio (and therefore the robot's curve) is preserved instead of clipped.\n\n`left = speed + turn`, `right = speed − turn`, then scale both by `max(|left|, |right|)` if that exceeds 1.",
    },
    {
      type: "coding",
      prompt:
        "Write `double arcadeLeft(double speed, double turn)` returning the *left* output of an arcade→tank conversion with desaturation: compute `left = speed + turn` and `right = speed - turn`, find `max = Math.max(Math.abs(left), Math.abs(right))`, and if `max > 1.0` divide `left` by `max`. Return `left`.",
      starter:
        "public double arcadeLeft(double speed, double turn) {\n    double left = speed + turn;\n    double right = speed - turn;\n    // desaturate: if either side exceeds 1.0, scale both down by the max\n}",
      solution:
        "public double arcadeLeft(double speed, double turn) {\n    double left = speed + turn;\n    double right = speed - turn;\n    double max = Math.max(Math.abs(left), Math.abs(right));\n    if (max > 1.0) {\n        left = left / max;\n    }\n    return left;\n}",
      checks: [
        { label: "Computes left = speed + turn", pattern: "left\\s*=\\s*speed\\s*\\+\\s*turn" },
        { label: "Computes right = speed - turn", pattern: "right\\s*=\\s*speed\\s*-\\s*turn" },
        { label: "Finds the max magnitude of both sides", pattern: "Math\\.max\\(\\s*Math\\.abs\\(\\s*left\\s*\\)\\s*,\\s*Math\\.abs\\(\\s*right\\s*\\)\\s*\\)" },
        { label: "Only scales when max > 1.0", pattern: "max\\s*>\\s*1(\\.0)?" },
      ],
      hint: "After computing left, right, and max: `if (max > 1.0) { left = left / max; } return left;`. At speed=1, turn=1: left=2, right=0, max=2, so left becomes 1.0.",
      tests: [
        { method: "arcadeLeft", args: [0.5, 0.2], expected: 0.7, tolerance: 1e-9 },
        { method: "arcadeLeft", args: [1.0, 1.0], expected: 1.0 },
        { method: "arcadeLeft", args: [0.8, 0.8], expected: 1.0, tolerance: 1e-9 },
        { method: "arcadeLeft", args: [0.5, -0.5], expected: 0.0 },
        { method: "arcadeLeft", args: [0.2, -1.0], expected: -0.6666666666666666, tolerance: 1e-9 },
      ],
    },
  ],
};

const subsystems: Lesson = {
  id: "subsystems",
  difficulty: "Medium",
  title: "Subsystems",
  blurb: "Organize the robot into independent, self-owning parts.",
  minutes: 16,
  blocks: [
    {
      type: "text",
      md: "Real robots have many moving parts, and code spirals into chaos if everything lives in one file. The **command-based** framework solves this with **subsystems**: each physical mechanism becomes a class that owns its hardware and exposes clean methods. You already built one — the `Arm` class — without the WPILib base class.",
    },
    {
      type: "code",
      lang: "java",
      caption: "A drivetrain subsystem",
      code: "public class Drivetrain extends SubsystemBase {\n    private final PWMSparkMax left = new PWMSparkMax(0);\n    private final PWMSparkMax right = new PWMSparkMax(1);\n    private final DifferentialDrive drive = new DifferentialDrive(left, right);\n\n    public void arcade(double speed, double turn) {\n        drive.arcadeDrive(speed, turn);\n    }\n\n    public void stop() {\n        drive.arcadeDrive(0, 0);\n    }\n}",
    },
    {
      type: "text",
      md: "`extends SubsystemBase` plugs your class into the framework. The motors are `private final` — owned by this subsystem and never reassigned. Everyone else interacts only through `arcade()` and `stop()`.",
    },
    {
      type: "callout",
      tone: "info",
      md: "The golden rule: **one subsystem owns each piece of hardware.** This is what prevents two parts of your code from sending conflicting commands to the same motor — the most common cause of mysterious robot behavior.",
    },
    {
      type: "quiz",
      question: "What is the main benefit of putting each mechanism in its own subsystem?",
      options: [
        "It makes the robot drive faster",
        "Each piece of hardware has a single owner, preventing conflicting commands",
        "It reduces the number of motors needed",
        "It is required to compile any robot code",
      ],
      answerIndex: 1,
      explanation:
        "Subsystems enforce single ownership of hardware. The command scheduler uses this to guarantee two commands never control the same motor at once.",
    },
    {
      type: "text",
      md: "Every subsystem can override a `periodic()` method. The scheduler calls it once per loop — the perfect place to read sensors, update closed-loop control, or log data, without cluttering your commands:",
    },
    {
      type: "code",
      lang: "java",
      code: "@Override\npublic void periodic() {\n    // runs ~50x/sec, automatically\n    SmartDashboard.putNumber(\"Arm Angle\", encoder.getDistance());\n}",
    },
    {
      type: "callout",
      tone: "tip",
      md: "A subsystem's public methods should describe **intent**, not raw hardware: prefer `intake.run()` over `intake.setMotor(0.7)`. Commands then read like sentences, and you can re-tune the 0.7 in one place.",
    },
    {
      type: "quiz",
      question: "Why are a subsystem's motor fields usually `private final`?",
      options: [
        "It makes the robot run faster",
        "So the subsystem solely owns them and the references can't be reassigned",
        "Java requires all motors to be final",
        "To use less memory",
      ],
      answerIndex: 1,
      explanation:
        "`private` keeps ownership inside the subsystem; `final` prevents the reference from being swapped out. Together they guarantee one clear owner for each piece of hardware.",
    },
    {
      type: "coding",
      prompt:
        "Make `Climber` a command-based subsystem: extend the correct WPILib base class and add a `public void stop()` that sets `motor` to 0.",
      starter:
        "public class Climber {\n    private final PWMSparkMax motor = new PWMSparkMax(9);\n\n    // add stop()\n}",
      solution:
        "public class Climber extends SubsystemBase {\n    private final PWMSparkMax motor = new PWMSparkMax(9);\n\n    public void stop() {\n        motor.set(0);\n    }\n}",
      checks: [
        { label: "Climber extends SubsystemBase", pattern: "class\\s+Climber\\s+extends\\s+SubsystemBase" },
        { label: "Has a public void stop()", pattern: "public\\s+void\\s+stop\\s*\\(\\s*\\)" },
        { label: "Stops the motor", pattern: "motor\\.set\\(\\s*0" },
      ],
      hint: "Add `extends SubsystemBase` to the class line, then a `stop()` method that calls `motor.set(0);`.",
    },
    {
      type: "text",
      md: "**Modern command-based code puts command *factories* on the subsystem itself.** Instead of writing a whole new class for every action, a subsystem exposes methods that return ready-made commands. The inherited `run(...)` and `runOnce(...)` helpers build a command that calls your code and *automatically requires this subsystem* — so the single-ownership rule is enforced for free.",
    },
    {
      type: "code",
      lang: "java",
      caption: "A command factory reads like a sentence at the call site",
      code: "public Command intakeCommand() {\n    return run(() -> motor.set(0.7));   // runs every loop while scheduled\n}\n\n// elsewhere:\ndriverController.a().whileTrue(intake.intakeCommand());",
    },
    {
      type: "quiz",
      question:
        "Two commands both call `addRequirements(intake)` and are scheduled at the same time. What does the scheduler do?",
      options: [
        "Runs both on the intake simultaneously",
        "Interrupts the already-running command and runs the new one — a subsystem can be required by only one command at a time",
        "Throws an error and disables the robot",
        "Silently ignores the second command forever",
      ],
      answerIndex: 1,
      explanation:
        "A subsystem can be required by at most one running command. Scheduling a new command that requires it interrupts the current one. That guaranteed hand-off is exactly how single ownership is enforced at runtime.",
    },
    {
      type: "coding",
      prompt:
        "Add a command-factory method `runIntake()` that returns a command which calls `set(0.7)` every loop while scheduled. Use the inherited `run(...)` helper with a lambda.",
      starter: "public Command runIntake() {\n    // return a command that calls set(0.7) each loop\n}",
      solution: "public Command runIntake() {\n    return run(() -> set(0.7));\n}",
      checks: [
        { label: "Returns a run(...) command", pattern: "return\\s+run\\(" },
        { label: "Uses a lambda (->)", pattern: "->" },
        { label: "Runs the intake at 0.7", pattern: "set\\(\\s*0\\.7\\s*\\)" },
      ],
      hint: "`return run(() -> set(0.7));` — `run` makes a command that calls the lambda each loop and requires this subsystem.",
    },
    {
      type: "text",
      md: "The single-ownership rule isn't magic — it's a small piece of bookkeeping the scheduler does. Let's model it. A subsystem remembers which command currently *requires* it. When a new command requires it, the new one takes over and the previous holder is **interrupted**. Re-requiring it with the *same* command (it's already running) is not an interruption. Counting those interruptions is exactly how you'd reason about why a command unexpectedly stopped.",
    },
    {
      type: "coding",
      prompt:
        "Model requirement arbitration. `require(int commandId)` gives ownership to that command; if a *different* command already owned it (owner is non-zero and not equal to this command), that's an interruption — increment `interruptions`. Then set `owner` to the new command. The tests drive a sequence of requirements and check the interrupt count.",
      starter:
        "public class Subsystem {\n    private int owner = 0;        // 0 = nobody owns it\n    private int interruptions = 0;\n\n    public void require(int commandId) {\n        // if a different command already owns this, count an interruption\n        // then give ownership to commandId\n    }\n\n    public int getOwner() {\n        return owner;\n    }\n\n    public int getInterruptions() {\n        return interruptions;\n    }\n}",
      solution:
        "public class Subsystem {\n    private int owner = 0;        // 0 = nobody owns it\n    private int interruptions = 0;\n\n    public void require(int commandId) {\n        if (owner != 0 && owner != commandId) {\n            interruptions += 1;\n        }\n        owner = commandId;\n    }\n\n    public int getOwner() {\n        return owner;\n    }\n\n    public int getInterruptions() {\n        return interruptions;\n    }\n}",
      checks: [
        { label: "Detects a different existing owner", pattern: "owner\\s*!=\\s*0\\s*&&\\s*owner\\s*!=\\s*commandId" },
        { label: "Counts the interruption", pattern: "interruptions\\s*\\+=\\s*1|interruptions\\s*=\\s*interruptions\\s*\\+\\s*1" },
        { label: "Transfers ownership", pattern: "owner\\s*=\\s*commandId" },
      ],
      hint: "`if (owner != 0 && owner != commandId) { interruptions += 1; }` then `owner = commandId;`.",
      stateTests: [
        {
          className: "Subsystem",
          ctorArgs: [],
          label: "two commands fighting over one subsystem",
          steps: [
            { method: "require", args: [1] },
            { method: "getInterruptions", args: [], expected: 0, label: "first claim — nobody interrupted → 0" },
            { method: "require", args: [1] },
            { method: "getInterruptions", args: [], expected: 0, label: "same command re-requires — not an interruption → 0" },
            { method: "require", args: [2] },
            { method: "getOwner", args: [], expected: 2, label: "command 2 takes over → owner 2" },
            { method: "getInterruptions", args: [], expected: 1, label: "command 1 was interrupted → 1" },
            { method: "require", args: [3] },
            { method: "getInterruptions", args: [], expected: 2, label: "command 2 interrupted in turn → 2" },
          ],
        },
      ],
    },
  ],
};

const commands: Lesson = {
  id: "commands",
  difficulty: "Hard",
  title: "Commands",
  blurb: "Describe robot actions as composable units the scheduler runs.",
  minutes: 17,
  blocks: [
    {
      type: "text",
      md: "A **command** is a self-contained action: drive forward for 2 seconds, raise the arm, follow a path. The **command scheduler** runs commands, makes sure two commands never use the same subsystem at once, and stops them when they finish. This is the architecture that championship teams build on.",
    },
    {
      type: "text",
      md: "Every command has four lifecycle methods:",
    },
    {
      type: "code",
      lang: "java",
      caption: "A command that drives forward until a distance is reached",
      code: "public class DriveDistance extends Command {\n    private final Drivetrain drivetrain;\n    private final double meters;\n\n    public DriveDistance(Drivetrain drivetrain, double meters) {\n        this.drivetrain = drivetrain;\n        this.meters = meters;\n        addRequirements(drivetrain);   // claim the subsystem\n    }\n\n    public void initialize() { drivetrain.resetEncoders(); }\n    public void execute() { drivetrain.arcade(0.5, 0); }\n    public boolean isFinished() { return drivetrain.getDistance() >= meters; }\n    public void end(boolean interrupted) { drivetrain.stop(); }\n}",
    },
    {
      type: "text",
      md: "- `initialize()` runs once when the command starts\n- `execute()` runs repeatedly (~50x/sec) while active\n- `isFinished()` returns `true` when the command should stop\n- `end()` runs once for cleanup\n\nNotice this mirrors the `Init`/`Periodic` pattern from WPILib — but now scoped to one action instead of the whole robot.",
    },
    {
      type: "callout",
      tone: "tip",
      md: "`addRequirements(drivetrain)` tells the scheduler this command needs the drivetrain. If another command grabs the drivetrain, the scheduler automatically interrupts this one. That's the single-ownership rule from the last lesson, enforced at runtime.",
    },
    {
      type: "text",
      md: "Commands compose. You can chain them into autonomous routines without writing new classes:",
    },
    {
      type: "code",
      lang: "java",
      code: "new DriveDistance(drivetrain, 3.0)\n    .andThen(new RaiseArm(arm))\n    .andThen(new DriveDistance(drivetrain, -1.0));",
    },
    {
      type: "callout",
      tone: "info",
      md: "You've now seen the whole beginner arc: variables → loops → functions → classes → subsystems → commands. Composing commands like this is exactly how a 15-second autonomous routine is built. You're ready for the Intermediate track.",
    },
    {
      type: "quiz",
      question: "Which command method decides when the action should stop?",
      options: ["initialize()", "execute()", "isFinished()", "end()"],
      answerIndex: 2,
      explanation:
        "`isFinished()` is polled every cycle; when it returns `true`, the scheduler calls `end()` and removes the command. `execute()` just does the repeated work.",
    },
    {
      type: "text",
      md: "You bind commands to triggers — buttons, sensors, or the start of autonomous — so they run at the right moment. This is how a controller button becomes a robot action:",
    },
    {
      type: "code",
      lang: "java",
      caption: "Run a command while a button is held",
      code: "driverController.a().whileTrue(new RaiseArm(arm));\n// pressing A runs RaiseArm; releasing it stops the command",
    },
    {
      type: "callout",
      tone: "info",
      md: "Composition operators like `andThen`, `alongWith` (run together), and `race` (whoever finishes first wins) let you build complex routines from simple commands — no giant `if/else` blocks. This is the payoff of the whole command-based model.",
    },
    {
      type: "quiz",
      question: "What does `addRequirements(drivetrain)` guarantee inside a command?",
      options: [
        "The command always runs first",
        "No other command will use the drivetrain at the same time",
        "The drivetrain never stops moving",
        "The command can never be interrupted",
      ],
      answerIndex: 1,
      explanation:
        "Declaring a requirement reserves that subsystem. If another command that also requires the drivetrain is scheduled, the scheduler interrupts this one — enforcing single ownership at runtime.",
    },
    {
      type: "coding",
      prompt:
        "Complete `isFinished()` so the command ends once `timer.get()` reaches at least 2 seconds.",
      starter: "public boolean isFinished() {\n    // return true after 2 seconds\n}",
      solution: "public boolean isFinished() {\n    return timer.get() >= 2.0;\n}",
      checks: [
        { label: "Returns a comparison on timer.get()", pattern: "return\\s+timer\\.get\\(\\s*\\)\\s*>=\\s*2" },
      ],
      hint: "`return timer.get() >= 2.0;` — the comparison itself evaluates to a boolean.",
    },
    {
      type: "text",
      md: "**Decorators and compositions are how big routines stay simple.** Rather than writing custom classes, you wrap and combine existing commands:\n\n- `.withTimeout(s)` — stop the command after `s` seconds no matter what\n- `.until(condition)` — stop when a condition becomes true\n- `.andThen(next)` — run sequentially (next after this finishes)\n- `.alongWith(other)` — run in **parallel**, finishing when both are done\n- `.raceWith(other)` — run in parallel, finishing when the **first** one ends",
    },
    {
      type: "code",
      lang: "java",
      caption: "A readable autonomous from small pieces",
      code: "new DriveDistance(drive, 3.0)\n    .andThen(new RaiseArm(arm).alongWith(new SpinUp(shooter)))\n    .andThen(new Shoot(shooter).withTimeout(1.5));",
    },
    {
      type: "quiz",
      question: "What is the difference between `a.andThen(b)` and `a.alongWith(b)`?",
      options: [
        "andThen runs a then b in sequence; alongWith runs a and b at the same time",
        "They are identical",
        "andThen runs them in parallel; alongWith runs them in sequence",
        "alongWith cancels a as soon as b starts",
      ],
      answerIndex: 0,
      explanation:
        "`andThen` is sequential — `b` starts after `a` finishes. `alongWith` is parallel — both run together and the group finishes when *both* are done. (`raceWith` finishes when the *first* one ends.)",
    },
    {
      type: "coding",
      prompt:
        "Build an autonomous command: run `new DriveForward(drive)` but cap it at 3 seconds with `.withTimeout(3.0)`, then chain `.andThen(new Stop(drive))`. Return the composed command.",
      starter: "public Command auto() {\n    // drive (max 3 seconds), then stop\n}",
      solution: "public Command auto() {\n    return new DriveForward(drive).withTimeout(3.0).andThen(new Stop(drive));\n}",
      checks: [
        { label: "Caps the drive at 3 seconds", pattern: "withTimeout\\(\\s*3(\\.0)?\\s*\\)" },
        { label: "Then runs Stop", pattern: "\\.andThen\\(\\s*new\\s+Stop\\(" },
      ],
      hint: "`return new DriveForward(drive).withTimeout(3.0).andThen(new Stop(drive));`",
    },
    {
      type: "text",
      md: "Let's implement the command lifecycle itself, in pure logic. A `DriveDistance` command accumulates distance each `execute()` and reports done from `isFinished()` once it reaches its target. The subtle correctness point: a well-behaved command **stops doing work once it's finished** — `execute()` must not keep driving past the target while the scheduler is still polling it in the same cycle. Guarding the accumulation with the same `distance >= targetMeters` test that `isFinished()` uses captures exactly that contract.",
    },
    {
      type: "coding",
      prompt:
        "Implement the lifecycle of a `DriveDistance` command. Each `execute(double delta)` adds `delta` to `distance` — but only while `distance` is still below `targetMeters`. `isFinished()` returns true once `distance` reaches `targetMeters`. The tests run several execute() cycles and confirm the command stops accumulating once it's done.",
      starter:
        "public class DriveDistance {\n    private final double targetMeters;\n    private double distance = 0;\n\n    public DriveDistance(double targetMeters) {\n        this.targetMeters = targetMeters;\n    }\n\n    public void execute(double delta) {\n        // advance by delta, but only while distance < targetMeters\n    }\n\n    public boolean isFinished() {\n        // done once distance reaches the target\n    }\n\n    public double getDistance() {\n        return distance;\n    }\n}",
      solution:
        "public class DriveDistance {\n    private final double targetMeters;\n    private double distance = 0;\n\n    public DriveDistance(double targetMeters) {\n        this.targetMeters = targetMeters;\n    }\n\n    public void execute(double delta) {\n        if (distance < targetMeters) {\n            distance += delta;\n        }\n    }\n\n    public boolean isFinished() {\n        return distance >= targetMeters;\n    }\n\n    public double getDistance() {\n        return distance;\n    }\n}",
      checks: [
        { label: "execute() only advances while below target", pattern: "if\\s*\\(\\s*distance\\s*<\\s*targetMeters\\s*\\)" },
        { label: "Accumulates distance", pattern: "distance\\s*\\+=\\s*delta|distance\\s*=\\s*distance\\s*\\+\\s*delta" },
        { label: "isFinished compares distance to target", pattern: "distance\\s*>=\\s*targetMeters" },
      ],
      hint: "execute: `if (distance < targetMeters) { distance += delta; }`. isFinished: `return distance >= targetMeters;`.",
      stateTests: [
        {
          className: "DriveDistance",
          ctorArgs: [1.0],
          label: "drive 1.0 m in 0.4 m steps, then stop accumulating",
          steps: [
            { method: "execute", args: [0.4] },
            { method: "getDistance", args: [], expected: 0.4, tolerance: 1e-9, label: "after one step → 0.4" },
            { method: "isFinished", args: [], expected: false, label: "not there yet → false" },
            { method: "execute", args: [0.4] },
            { method: "execute", args: [0.4] },
            { method: "isFinished", args: [], expected: true, label: "reached 1.2 ≥ 1.0 → finished" },
            { method: "execute", args: [0.4] },
            { method: "getDistance", args: [], expected: 1.2, tolerance: 1e-9, label: "finished, so execute() no longer advances → still 1.2" },
          ],
        },
      ],
    },
  ],
};

export const beginnerTrack: Track = {
  id: "beginner",
  title: "Beginner: Zero to Command-Based",
  level: "Beginner",
  blurb:
    "Start from no programming experience and finish able to read and write command-based FRC robot code.",
  modules: [
    {
      id: "programming-fundamentals",
      title: "Programming Fundamentals",
      blurb: "The universal building blocks, taught on robot examples.",
      lessons: [variables, loops, functions, classes],
    },
    {
      id: "java-fundamentals",
      title: "Java Fundamentals",
      blurb: "The specific language FRC robots are written in.",
      lessons: [javaBasics],
    },
    {
      id: "robot-fundamentals",
      title: "Robot Fundamentals",
      blurb: "Meet WPILib and make a robot move.",
      lessons: [wpilibIntro, motorsAndDrive],
    },
    {
      id: "command-based",
      title: "Command-Based Programming",
      blurb: "The architecture real teams build championship robots on.",
      lessons: [subsystems, commands],
    },
  ],
};

export const tracks: Track[] = [beginnerTrack, intermediateTrack, advancedTrack, swerveTrack];

// --- Lookup helpers -------------------------------------------------------

export function getTrack(id: string): Track | undefined {
  return tracks.find((t) => t.id === id);
}

export interface LessonLocation {
  track: Track;
  moduleIndex: number;
  lessonIndex: number;
  lesson: Lesson;
}

/** Flatten every lesson across every track in order, with its location. */
export function allLessonsInOrder(): LessonLocation[] {
  const out: LessonLocation[] = [];
  for (const track of tracks) {
    track.modules.forEach((module, moduleIndex) => {
      module.lessons.forEach((lesson, lessonIndex) => {
        out.push({ track, moduleIndex, lessonIndex, lesson });
      });
    });
  }
  return out;
}

export function findLesson(lessonId: string): LessonLocation | undefined {
  return allLessonsInOrder().find((l) => l.lesson.id === lessonId);
}

/** Lessons of a single track in order. */
export function trackLessons(track: Track): Lesson[] {
  return track.modules.flatMap((m) => m.lessons);
}

/** All blocks of a lesson in order, transparently across the new sectioned
 *  model and the legacy flat model. Everything else should read blocks via
 *  this rather than touching `lesson.blocks` / `lesson.sections` directly. */
export function lessonBlocks(lesson: Lesson): Block[] {
  if (lesson.sections?.length) return lesson.sections.flatMap((s) => s.blocks);
  return lesson.blocks ?? [];
}

/** Estimated minutes: sum of section estimates for sectioned lessons, else the
 *  lesson's own `minutes`. */
export function lessonMinutes(lesson: Lesson): number {
  if (lesson.sections?.length) return lesson.sections.reduce((n, s) => n + s.minutes, 0);
  return lesson.minutes;
}

/** True if a block is a gradable activity (counts toward lesson completion). */
function isGradable(b: Block): boolean {
  return (
    b.type === "quiz" ||
    b.type === "coding" ||
    b.type === "knowledgeCheck" ||
    b.type === "predict"
  );
}

/** Number of gradable activities in a lesson (across both content models). */
export function activityCount(lesson: Lesson): number {
  return lessonBlocks(lesson).filter(isGradable).length;
}

export function nextLesson(lessonId: string): Lesson | undefined {
  const loc = findLesson(lessonId);
  if (!loc) return undefined;
  const lessons = trackLessons(loc.track);
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1 || idx + 1 >= lessons.length) return undefined;
  return lessons[idx + 1];
}

export function previousLesson(lessonId: string): Lesson | undefined {
  const loc = findLesson(lessonId);
  if (!loc) return undefined;
  const lessons = trackLessons(loc.track);
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx <= 0) return undefined;
  return lessons[idx - 1];
}
