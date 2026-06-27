import type { Lesson } from "../types";

// Encoders, rebuilt in the Learn → Practice → Implement → Master model.
// Runtime-tested exercises pass conversion factors as PARAMETERS (the
// interpreter evaluates free fields to undefined).

export const encodersLesson: Lesson = {
  id: "encoders",
  title: "Encoders",
  blurb: "Measure how far and how fast a mechanism has moved — through the full gear chain.",
  difficulty: "Medium",
  minutes: 0,
  objectives: [
    "Explain what an encoder measures and what distance-per-pulse does",
    "Distinguish relative vs absolute encoders and know when each is needed",
    "Explain why velocity readings are noisy and how teams smooth them",
    "Convert raw ticks to meters through the full ticks → gears → wheel chain",
    "Accumulate distance from per-loop tick deltas — the building block of odometry",
  ],
  sections: [
    {
      kind: "learn",
      minutes: 10,
      blurb: "What ticks mean, and the chain that turns them into real-world units.",
      blocks: [
        {
          type: "text",
          md: "An **encoder** reports rotation. Mounted on a motor or shaft, it counts **ticks** as things spin, letting your code answer two questions it was blind to before: *how far* has the mechanism moved, and *how fast* is it moving right now? This feedback is the foundation of every control loop you'll write.",
        },
        {
          type: "code",
          lang: "java",
          caption: "Configure an encoder and convert ticks to meters",
          code: "Encoder encoder = new Encoder(0, 1);\n\n// 2048 ticks per revolution, 0.15 m wheel circumference\nencoder.setDistancePerPulse(0.15 / 2048.0);\n\ndouble meters = encoder.getDistance();\ndouble metersPerSec = encoder.getRate();",
        },
        {
          type: "callout",
          tone: "tip",
          md: "`setDistancePerPulse` is the scale factor from ticks to physical units. Get it right once and every distance you read is in meters; get it wrong and every control loop downstream is off.",
        },
        {
          type: "text",
          md: "Two things every team must internalize:\n\n- **Relative vs absolute.** Relative encoders read 0 wherever they powered on, so you `reset()` them at a known point (or home the mechanism). Absolute encoders always know their angle — ideal for arms that must know where they are at boot.\n- **Position is clean; velocity is noisy.** `getRate()` differentiates position (Δdistance ÷ Δtime), and differentiation amplifies the encoder's tiny quantization steps into a jumpy signal. Teams smooth it with a filter or read velocity from the motor controller's onboard sensor.",
        },
        {
          type: "code",
          lang: "java",
          caption: "Ticks → real units depends on the full mechanical chain",
          code: "// encoder on the motor, geared down to a mechanism, driving a wheel\ndouble motorRevs     = ticks / TICKS_PER_REV;\ndouble mechanismRevs = motorRevs / GEAR_RATIO;\ndouble meters        = mechanismRevs * Math.PI * WHEEL_DIAMETER;",
        },
      ],
    },
    {
      kind: "practice",
      minutes: 14,
      blurb: "Lock down the concepts, trace a conversion, then write and repair one.",
      blocks: [
        {
          type: "knowledgeCheck",
          title: "Knowledge check — reading an encoder",
          questions: [
            {
              question: "What does setDistancePerPulse accomplish?",
              options: [
                "It makes the encoder count faster",
                "It converts raw encoder ticks into real-world units like meters",
                "It resets the encoder to zero",
                "It inverts the encoder direction",
              ],
              answerIndex: 1,
              explanation:
                "Distance-per-pulse is the scale factor from ticks to physical units; afterward getDistance() returns meters instead of raw counts.",
            },
            {
              question: "Your arm must know its angle the instant the robot powers on, before any homing. Which encoder type do you need?",
              options: ["Relative", "Absolute", "Either works", "Neither — use a limit switch"],
              answerIndex: 1,
              explanation:
                "Relative encoders read 0 at boot and need homing; an absolute encoder reports the true angle immediately.",
            },
            {
              question: "Why is a raw getRate() velocity reading jumpy?",
              options: [
                "Encoders can't measure velocity",
                "Velocity is differentiated from position, amplifying quantization noise",
                "The robot moves too slowly to register",
                "The encoder is broken",
              ],
              answerIndex: 1,
              explanation:
                "Velocity = Δposition / Δtime; differentiation magnifies the encoder's discrete steps. A filter or the controller's hardware velocity smooths it.",
            },
            {
              question: "An encoder on the motor reads the motor's rotation, but you care about the mechanism after a 10:1 gearbox. What converts motor revs to mechanism revs?",
              options: [
                "Multiply by the gear ratio",
                "Divide by the gear ratio",
                "Multiply by π",
                "Nothing — they're the same",
              ],
              answerIndex: 1,
              explanation:
                "A 10:1 reduction means the motor turns 10× for each mechanism turn, so mechanism revs = motor revs / gear ratio.",
            },
            {
              question: "You set distance-per-pulse wrong by a factor of 2. What's the symptom?",
              options: [
                "The encoder stops counting",
                "Every distance- and velocity-based command is off by 2×, though the code looks correct",
                "The robot won't compile",
                "Only autonomous is affected",
              ],
              answerIndex: 1,
              explanation:
                "The conversion sits under everything; a wrong factor silently scales all downstream distances and velocities.",
            },
          ],
        },
        {
          type: "predict",
          prompt: "A 2048-tick motor encoder behind a 10:1 gearbox. How many mechanism rotations is one full motor revolution (2048 ticks)?",
          code: "double ticks = 2048;\ndouble ticksPerRev = 2048;\ndouble gearRatio = 10;\n\ndouble mechRotations = (ticks / ticksPerRev) / gearRatio;\nSystem.out.println(mechRotations);",
          options: ["0.1", "1.0", "10.0", "0.0"],
          answerIndex: 0,
          explanation:
            "2048/2048 = 1 motor rev; 1 / 10 = 0.1 mechanism rotations. The gearbox reduces motion 10×.",
        },
        {
          type: "coding",
          variant: "exercise",
          title: "Guided exercise — ticks to mechanism rotations",
          prompt:
            "Write `double mechanismRotations(double ticks, double ticksPerRev, double gearRatio)` = `(ticks / ticksPerRev) / gearRatio`.",
          starter:
            "public double mechanismRotations(double ticks, double ticksPerRev, double gearRatio) {\n    // ticks -> motor revolutions -> mechanism rotations\n}",
          solution:
            "public double mechanismRotations(double ticks, double ticksPerRev, double gearRatio) {\n    return (ticks / ticksPerRev) / gearRatio;\n}",
          checks: [
            { label: "Divides ticks by ticksPerRev", pattern: "ticks\\s*/\\s*ticksPerRev" },
            { label: "Divides by the gear ratio", pattern: "/\\s*gearRatio" },
            { label: "Returns the result", pattern: "return\\s+" },
          ],
          hint: "`return (ticks / ticksPerRev) / gearRatio;`",
          tests: [
            { method: "mechanismRotations", args: [2048.0, 2048.0, 10.0], expected: 0.1, tolerance: 1e-9 },
            { method: "mechanismRotations", args: [2048.0, 2048.0, 1.0], expected: 1.0, tolerance: 1e-9 },
            { method: "mechanismRotations", args: [4096.0, 2048.0, 2.0], expected: 1.0, tolerance: 1e-9 },
            { method: "mechanismRotations", args: [0.0, 2048.0, 10.0], expected: 0.0 },
          ],
        },
        {
          type: "coding",
          variant: "debug",
          title: "Debugging challenge — the gearbox the wrong way",
          prompt:
            "This conversion *multiplies* by the gear ratio instead of dividing, so a 10:1 reduction reports 100× too much motion. Fix it to divide by `gearRatio`.",
          starter:
            "public double mechanismRotations(double ticks, double ticksPerRev, double gearRatio) {\n    return (ticks / ticksPerRev) * gearRatio;   // bug: reduction divides, not multiplies\n}",
          solution:
            "public double mechanismRotations(double ticks, double ticksPerRev, double gearRatio) {\n    return (ticks / ticksPerRev) / gearRatio;\n}",
          checks: [
            { label: "Divides by the gear ratio", pattern: "/\\s*ticksPerRev\\s*\\)?\\s*/\\s*gearRatio|ticks\\s*/\\s*ticksPerRev\\s*/\\s*gearRatio" },
          ],
          hint: "A reduction means the mechanism turns *less* than the motor: divide by `gearRatio`.",
          tests: [
            { method: "mechanismRotations", args: [2048.0, 2048.0, 10.0], expected: 0.1, tolerance: 1e-9 },
            { method: "mechanismRotations", args: [2048.0, 2048.0, 2.0], expected: 0.5, tolerance: 1e-9 },
          ],
        },
      ],
    },
    {
      kind: "implement",
      minutes: 12,
      blurb: "Build the full ticks-to-meters conversion every distance command relies on.",
      blocks: [
        {
          type: "text",
          md: "This is the conversion every distance-based command and all of odometry depends on. Ticks become motor revolutions (÷ ticks-per-rev), then mechanism revolutions (÷ gear ratio), then meters of wheel travel (× π × diameter). One wrong factor and the robot drives the wrong distance with code that looks correct.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Implementation lab — ticks to meters",
          prompt:
            "Write `double ticksToMeters(double ticks, double ticksPerRev, double gearRatio, double wheelDiameter)` = `(ticks / ticksPerRev / gearRatio) × (π × wheelDiameter)`.",
          starter:
            "public double ticksToMeters(double ticks, double ticksPerRev, double gearRatio, double wheelDiameter) {\n    // ticks -> motor revs -> mechanism revs -> meters\n}",
          solution:
            "public double ticksToMeters(double ticks, double ticksPerRev, double gearRatio, double wheelDiameter) {\n    double mechRevs = ticks / ticksPerRev / gearRatio;\n    return mechRevs * Math.PI * wheelDiameter;\n}",
          checks: [
            { label: "Divides ticks by ticksPerRev", pattern: "ticks\\s*/\\s*ticksPerRev" },
            { label: "Divides by gearRatio", pattern: "/\\s*gearRatio" },
            { label: "Multiplies by circumference (π × diameter)", pattern: "Math\\.PI\\s*\\*\\s*wheelDiameter|wheelDiameter\\s*\\*\\s*Math\\.PI" },
          ],
          hint: "`double mechRevs = ticks / ticksPerRev / gearRatio;` then `return mechRevs * Math.PI * wheelDiameter;`.",
          tests: [
            { method: "ticksToMeters", args: [2048.0, 2048.0, 1.0, 0.1016], expected: 0.31919, tolerance: 1e-4 },
            { method: "ticksToMeters", args: [2048.0, 2048.0, 10.0, 0.1016], expected: 0.031919, tolerance: 1e-5 },
            { method: "ticksToMeters", args: [0.0, 2048.0, 10.0, 0.1016], expected: 0.0 },
            { method: "ticksToMeters", args: [4096.0, 2048.0, 2.0, 0.1016], expected: 0.31919, tolerance: 1e-4 },
          ],
        },
      ],
    },
    {
      kind: "master",
      minutes: 10,
      blurb: "Accumulate distance over time — the core of odometry — and reason about drift.",
      blocks: [
        {
          type: "text",
          md: "Odometry works by **accumulating** small per-loop movements. Build a `DriveEncoder` that holds a `metersPerTick` scale and a running `total`: each loop you feed it the tick *delta* since last loop, and it adds the corresponding meters. Reading absolute distance is then just the accumulated total.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Mastery lab — accumulating distance",
          prompt:
            "Implement `DriveEncoder`. The constructor takes `metersPerTick`. `update(double deltaTicks)` adds `deltaTicks * metersPerTick` to a running `total` (starts at 0). `getMeters()` returns the total. The tests feed several deltas — including a negative one for reversing.",
          starter:
            "public class DriveEncoder {\n    private final double metersPerTick;\n    private double total = 0;\n\n    public DriveEncoder(double metersPerTick) {\n        this.metersPerTick = metersPerTick;\n    }\n\n    public void update(double deltaTicks) {\n        // add the converted delta to total\n    }\n\n    public double getMeters() {\n        return total;\n    }\n}",
          solution:
            "public class DriveEncoder {\n    private final double metersPerTick;\n    private double total = 0;\n\n    public DriveEncoder(double metersPerTick) {\n        this.metersPerTick = metersPerTick;\n    }\n\n    public void update(double deltaTicks) {\n        total += deltaTicks * metersPerTick;\n    }\n\n    public double getMeters() {\n        return total;\n    }\n}",
          checks: [
            { label: "Accumulates deltaTicks * metersPerTick into total", pattern: "total\\s*\\+=\\s*deltaTicks\\s*\\*\\s*metersPerTick|total\\s*=\\s*total\\s*\\+\\s*deltaTicks\\s*\\*\\s*metersPerTick" },
          ],
          hint: "`total += deltaTicks * metersPerTick;`",
          stateTests: [
            {
              className: "DriveEncoder",
              ctorArgs: [0.001],
              label: "accumulate forward, then reverse",
              steps: [
                { method: "update", args: [100.0] },
                { method: "getMeters", args: [], expected: 0.1, tolerance: 1e-9, label: "100 ticks → 0.1 m" },
                { method: "update", args: [400.0] },
                { method: "getMeters", args: [], expected: 0.5, tolerance: 1e-9, label: "cumulative → 0.5 m" },
                { method: "update", args: [-200.0] },
                { method: "getMeters", args: [], expected: 0.3, tolerance: 1e-9, label: "reversed 200 ticks → 0.3 m" },
              ],
            },
          ],
        },
        {
          type: "knowledgeCheck",
          title: "Mastery check — trusting the number",
          questions: [
            {
              question:
                "Your accumulated-distance odometry slowly drifts off over a long match even though the conversion is exact. What's the most likely cause?",
              options: [
                "The encoder is broken",
                "Wheel slip and rounding accumulate — fuse with other sensors (gyro/vision) rather than trusting wheels alone",
                "metersPerTick must be recomputed each loop",
                "The total overflows",
              ],
              answerIndex: 1,
              explanation:
                "Dead-reckoning from wheels accumulates error from slip and tiny rounding. Real robots fuse wheel odometry with a gyro and vision to correct the drift.",
            },
          ],
        },
      ],
    },
  ],
};
