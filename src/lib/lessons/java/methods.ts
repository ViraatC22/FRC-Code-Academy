import type { Lesson } from "../../types";

export const javaMethodsLesson: Lesson = {
  id: "java-methods",
  title: "Methods",
  blurb: "Package logic into named, reusable units — the verbs of your robot code.",
  difficulty: "Easy",
  minutes: 0,
  objectives: [
    "Explain why methods exist: naming, reuse, and abstraction",
    "Declare methods with parameters and a return type, and use void correctly",
    "Distinguish returning a value from printing or mutating state",
    "Understand overloading and that parameters are passed by value",
    "Implement reusable helper methods used across real robot code",
  ],
  sections: [
    {
      kind: "learn",
      title: "Why Methods Exist",
      minutes: 9,
      blurb: "A method is a named, reusable action — the unit you think and build in.",
      blocks: [
        {
          type: "text",
          md: "A **method** is a named block of code that performs one task. If variables are the *nouns* of your program — the things — methods are the *verbs* — the actions. `raiseArm()`, `getDistance()`, `arcadeDrive(speed, turn)`: each names a capability you can invoke without re-reading how it works inside.",
        },
        {
          type: "text",
          md: "Methods earn their keep three ways, and each matters on a robot:\n\n- **Naming (abstraction).** `intake.run()` reads like a sentence and hides the motor details. Whoever calls it doesn't need to know it sets a Spark to 0.7 — they just express intent. Good method names turn a wall of motor commands into readable robot behavior.\n- **Reuse (don't repeat yourself).** Write the ticks-to-meters conversion once, call it everywhere. When the wheel size changes, you fix one method instead of hunting down a dozen copies — and copies are where bugs hide, because you always miss one.\n- **Structure.** WPILib's whole framework is built on methods it calls *for* you: `robotInit()`, `teleopPeriodic()`, a command's `execute()`. You write robot code by *filling in methods*, so understanding them is understanding how FRC code is organized.",
        },
        {
          type: "quiz",
          question: "What is the main benefit of wrapping `motor.set(0.7)` inside a method named `run()`?",
          options: [
            "It makes the motor spin faster",
            "Callers express intent (intake.run()) without knowing the hardware details, and the speed lives in one place to change",
            "Methods are required for code to compile",
            "It uses less memory than calling motor.set directly",
          ],
          answerIndex: 1,
          explanation:
            "A well-named method abstracts away the implementation: call sites read clearly and the detail (0.7) is defined once, so re-tuning or rewiring touches a single method.",
        },
      ],
    },
    {
      kind: "learn",
      title: "Parameters & Return Values",
      minutes: 11,
      blurb: "The inputs a method takes and the answer it hands back.",
      blocks: [
        {
          type: "text",
          md: "A method's signature declares everything a caller needs: a **return type**, a **name**, and a list of **parameters** (typed inputs).\n\n```\npublic double clamp(double value, double min, double max) {\n    ...\n    return result;\n}\n```\n\nThe `double` at the front is the **return type** — the kind of value this method hands back. Inside, a `return` statement produces that value and immediately ends the method. The parameters `(double value, double min, double max)` are local variables filled in with whatever the caller passes: `clamp(out, -1.0, 1.0)`.",
        },
        {
          type: "text",
          md: "When a method computes an answer, it should **return** that answer rather than printing it or stashing it in a field. A method that `return`s a value is reusable and testable — any caller can use the result however it needs. This is also why every exercise in this course asks you to *return* a computed value: a method's job is to take inputs and produce an output.\n\nWhen a method performs an *action* but has no answer to give — `raiseArm()`, `stop()` — its return type is **`void`**, meaning 'returns nothing.' WPILib's `teleopPeriodic()` is `void`: it *does* things each loop but hands nothing back.",
        },
        {
          type: "callout",
          tone: "tip",
          md: "A subtle but important rule: Java passes parameters **by value** — the method receives a *copy* of each argument. Reassigning a parameter inside a method does not change the caller's variable. (Objects are a nuance you'll meet in the OOP module, but for the primitive types here, the copy rule is clean and absolute.)",
        },
        {
          type: "predict",
          prompt: "What does this print?",
          code: "public int doubleIt(int n) {\n    n = n * 2;\n    return n;\n}\n\nint x = 5;\nint y = doubleIt(x);\nSystem.out.println(x + \", \" + y);",
          options: ["10, 10", "5, 10", "10, 5", "5, 5"],
          answerIndex: 1,
          explanation:
            "Java passes x by value, so doubleIt works on a copy. The caller's x stays 5; the method returns 10, which becomes y. Output: 5, 10.",
        },
        {
          type: "coding",
          variant: "exercise",
          title: "Guided exercise — clamp a value",
          prompt:
            "Write `double clamp(double value, double min, double max)` that returns `value` limited to the range [min, max]: if value is below min return min, if above max return max, otherwise return value. (This is exactly how robot code keeps a controller output within motor limits.)",
          starter:
            "public double clamp(double value, double min, double max) {\n    // below min -> min, above max -> max, else value\n}",
          solution:
            "public double clamp(double value, double min, double max) {\n    if (value < min) {\n        return min;\n    }\n    if (value > max) {\n        return max;\n    }\n    return value;\n}",
          checks: [
            { label: "Returns min when below the range", pattern: "value\\s*<\\s*min" },
            { label: "Returns max when above the range", pattern: "value\\s*>\\s*max" },
            { label: "Returns value otherwise", pattern: "return\\s+value" },
          ],
          hint: "Two guards then a fall-through: `if (value < min) return min; if (value > max) return max; return value;`.",
          tests: [
            { method: "clamp", args: [1.5, -1.0, 1.0], expected: 1.0, tolerance: 1e-9 },
            { method: "clamp", args: [-2.0, -1.0, 1.0], expected: -1.0, tolerance: 1e-9 },
            { method: "clamp", args: [0.4, -1.0, 1.0], expected: 0.4, tolerance: 1e-9 },
            { method: "clamp", args: [5.0, 0.0, 10.0], expected: 5.0, tolerance: 1e-9 },
          ],
        },
      ],
    },
    {
      kind: "learn",
      title: "Overloading",
      minutes: 6,
      blurb: "Several methods, one name, different inputs.",
      blocks: [
        {
          type: "text",
          md: "Java lets two methods share a **name** as long as their **parameter lists differ** — this is **overloading**. WPILib uses it constantly: `arcadeDrive(speed, turn)` and `arcadeDrive(speed, turn, squareInputs)` are two methods, and the compiler picks the right one by the arguments you pass. Overloading lets a family of related actions share one obvious name instead of inventing `arcadeDrive2` and `arcadeDriveWithSquaring`.\n\nWhat makes them distinct is the parameter types and count — *not* the return type. You cannot overload by changing only the return type, because at a call site Java wouldn't know which one you meant.",
        },
        {
          type: "quiz",
          question: "What makes two overloaded methods with the same name distinct to the Java compiler?",
          options: [
            "Their return types",
            "Their parameter lists (the number and types of parameters)",
            "The order they appear in the file",
            "Their access level (public/private)",
          ],
          answerIndex: 1,
          explanation:
            "Overloads are told apart by their parameters. The return type alone can't distinguish them, because the compiler resolves the call from the arguments passed.",
        },
      ],
    },
    {
      kind: "implement",
      title: "Implement — A Reusable Helper",
      minutes: 7,
      blurb: "Write a method real robot code would call from many places.",
      blocks: [
        {
          type: "text",
          md: "Drivers often want fine control at low speed and full power at the extremes, so teams *scale* joystick input — for example, applying a maximum-speed cap so a stick of 1.0 only commands 70% during delicate maneuvers. That's a one-line method called from the drive code every loop. Writing it as a method (rather than inline) means you can re-tune the behavior in one place and reuse it for every axis.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Implementation lab — scale to a max",
          prompt:
            "Write `double scaleToMax(double input, double maxOutput)` that returns `input` multiplied by `maxOutput` — scaling a -1.0..1.0 stick value down to a -maxOutput..maxOutput range.",
          starter: "public double scaleToMax(double input, double maxOutput) {\n    // scale the input by the max output\n}",
          solution: "public double scaleToMax(double input, double maxOutput) {\n    return input * maxOutput;\n}",
          checks: [
            { label: "Multiplies input by maxOutput", pattern: "input\\s*\\*\\s*maxOutput|maxOutput\\s*\\*\\s*input" },
            { label: "Returns the result", pattern: "return\\s+" },
          ],
          hint: "`return input * maxOutput;`",
          tests: [
            { method: "scaleToMax", args: [1.0, 0.7], expected: 0.7, tolerance: 1e-9 },
            { method: "scaleToMax", args: [-1.0, 0.7], expected: -0.7, tolerance: 1e-9 },
            { method: "scaleToMax", args: [0.5, 0.8], expected: 0.4, tolerance: 1e-9 },
            { method: "scaleToMax", args: [0.0, 0.7], expected: 0.0 },
          ],
        },
      ],
    },
    {
      kind: "master",
      title: "Master — Composing Helpers in Your Head",
      minutes: 6,
      blurb: "See how small methods combine into real driver-control code.",
      blocks: [
        {
          type: "text",
          md: "The power of methods is composition: small, well-named functions stack into readable behavior. A team's drive code might process a raw stick value as `clamp(scaleToMax(deadband(raw, 0.1), 0.7), -1.0, 1.0)` — deadband it, scale it to 70%, then clamp it to legal range. Each method does one thing and was tested on its own, so the combined line is trustworthy *and* readable. You don't re-derive the logic; you read it like a sentence of verbs.\n\nIn this lab you'll write one more reusable helper — converting a target RPM into a motor fraction given a known maximum RPM — the kind of small conversion a shooter subsystem calls every loop.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Mastery lab — RPM to fraction",
          prompt:
            "Write `double rpmToFraction(double targetRpm, double maxRpm)` that returns what fraction of the flywheel's maximum the target represents: `targetRpm / maxRpm`. (Use double division — both inputs are already doubles.)",
          starter: "public double rpmToFraction(double targetRpm, double maxRpm) {\n    // what fraction of maxRpm is targetRpm?\n}",
          solution: "public double rpmToFraction(double targetRpm, double maxRpm) {\n    return targetRpm / maxRpm;\n}",
          checks: [
            { label: "Divides targetRpm by maxRpm", pattern: "targetRpm\\s*/\\s*maxRpm" },
            { label: "Returns the result", pattern: "return\\s+" },
          ],
          hint: "`return targetRpm / maxRpm;`",
          tests: [
            { method: "rpmToFraction", args: [2500.0, 5000.0], expected: 0.5, tolerance: 1e-9 },
            { method: "rpmToFraction", args: [5000.0, 5000.0], expected: 1.0, tolerance: 1e-9 },
            { method: "rpmToFraction", args: [1000.0, 4000.0], expected: 0.25, tolerance: 1e-9 },
            { method: "rpmToFraction", args: [0.0, 5000.0], expected: 0.0 },
          ],
        },
        {
          type: "knowledgeCheck",
          title: "Mastery check — methods",
          questions: [
            {
              question: "A method that performs an action but computes no answer to hand back should have which return type?",
              options: ["double", "boolean", "void", "int"],
              answerIndex: 2,
              explanation: "void means 'returns nothing.' Action methods like stop() or teleopPeriodic() are void.",
            },
            {
              question: "You pass an int variable `x` to a method that reassigns its parameter. After the call, what is `x` in the caller?",
              options: [
                "Whatever the method set it to",
                "Unchanged — Java passes primitives by value, so the method modified a copy",
                "Zero",
                "It causes a compile error",
              ],
              answerIndex: 1,
              explanation:
                "Primitives are passed by value: the method gets a copy, so reassigning the parameter never affects the caller's variable.",
            },
          ],
        },
      ],
    },
  ],
};
