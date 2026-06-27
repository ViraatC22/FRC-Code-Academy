import type { Lesson } from "../types";

// Feedforward, rebuilt in the Learn → Practice → Implement → Master model
// (sibling of the PID exemplar so the whole Closed-Loop module is consistent).
// Runtime-tested exercises pass gains as PARAMETERS — the interpreter evaluates
// free fields to undefined, so a method that reads a bare `kS` can't be tested.

export const feedforwardLesson: Lesson = {
  id: "feedforward",
  title: "Feedforward",
  blurb: "Predict the voltage a mechanism needs — model the physics, then build it.",
  difficulty: "Hard",
  minutes: 0, // derived from sections
  objectives: [
    "Explain why feedforward is predictive where PID is reactive",
    "State what kS, kV, kA (and kG) each model physically",
    "Compute the kS·sgn(v) + kV·v + kA·a model by hand",
    "Find and fix a feedforward that fails to overcome static friction",
    "Build a flywheel controller that combines feedforward with PID feedback",
  ],
  sections: [
    // ── LEARN ──────────────────────────────────────────────────────────────
    {
      kind: "learn",
      minutes: 11,
      blurb: "Why predict effort at all, and the exact voltage model WPILib uses.",
      blocks: [
        {
          type: "text",
          md: "PID is **reactive** — it only acts once there's an error. **Feedforward** is **predictive**: it models the physics of your mechanism and supplies the voltage you *know* it'll need. Pair the two and feedforward does the heavy lifting while PID cleans up the small remaining error — far better than either alone.",
        },
        {
          type: "text",
          md: "Each gain models a specific physical effect, and you measure them with a characterization tool (SysId) rather than guessing:\n\n- **kS** — static friction: the volts just to *start* moving, applied in the direction of motion\n- **kV** — volts per unit of velocity (the dominant term at steady speed)\n- **kA** — volts per unit of acceleration (matters during fast changes)\n- **kG** — (arms/elevators) the volts to hold against gravity, even at zero speed\n\nThe full simple-motor model is:\n\n`u = kS·sgn(v) + kV·v + kA·a`\n\nNote `sgn(v)` is `0` when `v` is `0`, so a stopped mechanism with no commanded acceleration gets `0` feedforward volts — correct, there's nothing to overcome.",
        },
        {
          type: "code",
          lang: "java",
          caption: "WPILib packages the model; you feed it the commanded motion",
          code: "SimpleMotorFeedforward ff = new SimpleMotorFeedforward(0.2, 2.5, 0.1);\n\n// voltage to reach a target velocity (and optional acceleration)\ndouble volts = ff.calculate(targetVelocity);\nmotor.setVoltage(volts);",
        },
        {
          type: "callout",
          tone: "tip",
          md: "Feedforward works in **volts**, which is why you pair it with `setVoltage()`. Voltage control stays consistent as the battery sags, unlike raw percent output — the same command means the same physical effort.",
        },
      ],
    },

    // ── PRACTICE ───────────────────────────────────────────────────────────
    {
      kind: "practice",
      minutes: 16,
      blurb: "Pin down the gains, trace the model, then write and repair it.",
      blocks: [
        {
          type: "knowledgeCheck",
          title: "Knowledge check — the gains",
          questions: [
            {
              question: "What is the key difference between feedforward and PID?",
              options: [
                "Feedforward predicts the needed effort; PID reacts to measured error",
                "They are two names for the same thing",
                "Feedforward only works on arms",
                "PID is predictive; feedforward is reactive",
              ],
              answerIndex: 0,
              explanation:
                "Feedforward uses a physical model to anticipate the required output; PID corrects whatever error remains.",
            },
            {
              question: "Which gain is the voltage needed just to overcome static friction and start moving?",
              options: ["kV", "kS", "kA", "Friction isn't modeled"],
              answerIndex: 1,
              explanation: "kS is the static gain — applied in the direction of travel to break friction.",
            },
            {
              question: "At a constant cruising velocity with no acceleration, which term dominates the output?",
              options: ["kA · a", "kV · v", "kS only", "kG"],
              answerIndex: 1,
              explanation:
                "With a = 0 the acceleration term vanishes; kV·v carries the steady-state voltage (plus the small static kS).",
            },
            {
              question: "Why does an arm need an extra kG term that a flywheel doesn't?",
              options: [
                "Arms spin faster",
                "Holding an arm up against gravity takes voltage even at zero speed",
                "kG replaces kV on arms",
                "Flywheels have more friction",
              ],
              answerIndex: 1,
              explanation:
                "Gravity pulls the arm down continuously, so it needs a holding voltage at rest. A flywheel's axis is gravity-neutral.",
            },
            {
              question: "Why pair feedforward with setVoltage() rather than set() (percent output)?",
              options: [
                "setVoltage is faster",
                "Voltage is consistent as the battery sags, so a command means the same physical effort",
                "set() doesn't work with feedforward",
                "It uses less CAN bandwidth",
              ],
              answerIndex: 1,
              explanation:
                "Percent output drifts with battery voltage; volts are an absolute, physics-based unit — which is what the model predicts.",
            },
          ],
        },
        {
          type: "predict",
          prompt: "With kS = 0.2 and kV = 2.5, what voltage does this print for a target velocity of 2.0?",
          code: "double kS = 0.2;\ndouble kV = 2.5;\ndouble vel = 2.0;\n\ndouble volts = kS * Math.signum(vel) + kV * vel;\nSystem.out.println(volts);",
          options: ["5.2", "5.0", "5.4", "2.7"],
          answerIndex: 0,
          explanation:
            "kS·sgn(2.0) = 0.2×1 = 0.2, kV·v = 2.5×2.0 = 5.0, total 5.2.",
        },
        {
          type: "coding",
          variant: "exercise",
          title: "Guided exercise — kS + kV by hand",
          prompt:
            "Implement a static+velocity feedforward. Write `double volts(double kS, double kV, double vel)` returning `kS * Math.signum(vel) + kV * vel` — the static term in the direction of motion plus the velocity term.",
          starter:
            "public double volts(double kS, double kV, double vel) {\n    // kS overcomes friction in the direction of motion; kV scales with velocity\n}",
          solution: "public double volts(double kS, double kV, double vel) {\n    return kS * Math.signum(vel) + kV * vel;\n}",
          checks: [
            { label: "Static term uses Math.signum(vel)", pattern: "kS\\s*\\*\\s*Math\\.signum\\(\\s*vel\\s*\\)" },
            { label: "Velocity term is kV * vel", pattern: "kV\\s*\\*\\s*vel" },
            { label: "Returns the sum", pattern: "return\\s+" },
          ],
          hint: "`return kS * Math.signum(vel) + kV * vel;` — `Math.signum` gives the direction (+1 / -1 / 0).",
          tests: [
            { method: "volts", args: [0.2, 2.5, 2.0], expected: 5.2, tolerance: 1e-9 },
            { method: "volts", args: [0.2, 2.5, -2.0], expected: -5.2, tolerance: 1e-9 },
            { method: "volts", args: [0.2, 2.5, 0.0], expected: 0.0 },
            { method: "volts", args: [0.5, 1.0, 0.5], expected: 1.0, tolerance: 1e-9 },
          ],
        },
        {
          type: "coding",
          variant: "debug",
          title: "Debugging challenge — friction never breaks",
          prompt:
            "This feedforward multiplies kS by the velocity instead of its sign. At low speeds it produces almost no static voltage, so the mechanism sticks and won't start moving. Fix the static term to use `Math.signum(vel)`.",
          starter:
            "public double volts(double kS, double kV, double vel) {\n    return kS * vel + kV * vel;   // bug: kS should not scale with velocity\n}",
          solution: "public double volts(double kS, double kV, double vel) {\n    return kS * Math.signum(vel) + kV * vel;\n}",
          checks: [
            { label: "Static term uses Math.signum(vel)", pattern: "kS\\s*\\*\\s*Math\\.signum\\(\\s*vel\\s*\\)" },
            { label: "Velocity term is kV * vel", pattern: "kV\\s*\\*\\s*vel" },
          ],
          hint: "kS is a constant push to break friction, independent of speed: `kS * Math.signum(vel)`.",
          tests: [
            { method: "volts", args: [0.2, 2.5, 2.0], expected: 5.2, tolerance: 1e-9 },
            { method: "volts", args: [0.2, 2.5, 0.5], expected: 1.45, tolerance: 1e-9 },
            { method: "volts", args: [0.2, 2.5, -1.0], expected: -2.7, tolerance: 1e-9 },
          ],
        },
      ],
    },

    // ── IMPLEMENT ──────────────────────────────────────────────────────────
    {
      kind: "implement",
      minutes: 14,
      blurb: "Build the full kS/kV/kA model a real flywheel runs every loop.",
      blocks: [
        {
          type: "text",
          md: "Now the complete model. A flywheel shooter commands a *target velocity and acceleration* each loop (from a motion profile, in the next lessons), and feedforward returns the voltage physics predicts — before PID touches the small remainder. Implement `u = kS·sgn(v) + kV·v + kA·a` as a pure function of its gains and the commanded motion.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Implementation lab — full motor feedforward",
          prompt:
            "Write `double feedforward(double kS, double kV, double kA, double velocity, double accel)` returning `kS*Math.signum(velocity) + kV*velocity + kA*accel`. The tests cover steady cruise, a dead stop, reverse, and a hard acceleration.",
          starter:
            "public double feedforward(double kS, double kV, double kA, double velocity, double accel) {\n    // kS in the direction of motion, plus the velocity and acceleration terms\n}",
          solution:
            "public double feedforward(double kS, double kV, double kA, double velocity, double accel) {\n    return kS * Math.signum(velocity) + kV * velocity + kA * accel;\n}",
          checks: [
            { label: "Static term kS * Math.signum(velocity)", pattern: "kS\\s*\\*\\s*Math\\.signum\\(\\s*velocity\\s*\\)" },
            { label: "Velocity term kV * velocity", pattern: "kV\\s*\\*\\s*velocity" },
            { label: "Acceleration term kA * accel", pattern: "kA\\s*\\*\\s*accel" },
          ],
          hint: "`return kS * Math.signum(velocity) + kV * velocity + kA * accel;`",
          tests: [
            { method: "feedforward", args: [0.2, 2.5, 0.1, 2.0, 0.0], expected: 5.2, tolerance: 1e-9 },
            { method: "feedforward", args: [0.2, 2.5, 0.1, 0.0, 0.0], expected: 0.0 },
            { method: "feedforward", args: [0.2, 2.5, 0.1, -2.0, 0.0], expected: -5.2, tolerance: 1e-9 },
            { method: "feedforward", args: [0.2, 2.5, 0.1, 1.0, 3.0], expected: 3.0, tolerance: 1e-9 },
            { method: "feedforward", args: [1.0, 0.0, 0.0, 5.0, 0.0], expected: 1.0, tolerance: 1e-9 },
          ],
        },
      ],
    },

    // ── MASTER ─────────────────────────────────────────────────────────────
    {
      kind: "master",
      minutes: 13,
      blurb: "Fuse predictive feedforward with reactive PID, then reason about tuning.",
      blocks: [
        {
          type: "text",
          md: "This is how championship velocity control actually works: **feedforward predicts, PID corrects.** Feedforward supplies `kS·sgn(target) + kV·target` to get the flywheel near the right speed instantly; a proportional term then nudges out the small remaining error from `target − measured`. Build the combined output as one function.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Mastery lab — feedforward + PID flywheel",
          prompt:
            "Write `double flywheel(double kS, double kV, double kP, double targetVel, double measuredVel)` returning the feedforward `kS*Math.signum(targetVel) + kV*targetVel` plus the proportional correction `kP*(targetVel - measuredVel)`. The tests check cold-start, at-speed (feedforward holds, P is zero), and a measured undershoot (P adds).",
          starter:
            "public double flywheel(double kS, double kV, double kP, double targetVel, double measuredVel) {\n    // feedforward for the target speed + proportional correction of the error\n}",
          solution:
            "public double flywheel(double kS, double kV, double kP, double targetVel, double measuredVel) {\n    return kS * Math.signum(targetVel) + kV * targetVel + kP * (targetVel - measuredVel);\n}",
          checks: [
            { label: "Feedforward static + velocity terms", pattern: "kS\\s*\\*\\s*Math\\.signum\\(\\s*targetVel\\s*\\)\\s*\\+\\s*kV\\s*\\*\\s*targetVel" },
            { label: "Proportional correction on the error", pattern: "kP\\s*\\*\\s*\\(\\s*targetVel\\s*-\\s*measuredVel\\s*\\)" },
          ],
          hint: "Three terms summed: `kS * Math.signum(targetVel) + kV * targetVel + kP * (targetVel - measuredVel)`.",
          tests: [
            { method: "flywheel", args: [0.2, 0.01, 0.05, 100.0, 0.0], expected: 6.2, tolerance: 1e-9, label: "cold start: FF + full P" },
            { method: "flywheel", args: [0.2, 0.01, 0.05, 100.0, 100.0], expected: 1.2, tolerance: 1e-9, label: "at speed: FF holds, P=0" },
            { method: "flywheel", args: [0.2, 0.01, 0.05, 100.0, 80.0], expected: 2.2, tolerance: 1e-9, label: "undershoot: P adds 1.0" },
            { method: "flywheel", args: [0.0, 0.0, 0.5, 10.0, 12.0], expected: -1.0, tolerance: 1e-9, label: "overshoot: P pulls back" },
          ],
        },
        {
          type: "knowledgeCheck",
          title: "Mastery check — tuning judgment",
          questions: [
            {
              question:
                "Your flywheel reaches the target but takes a moment to get there, and the recording shows it needed more voltage during spin-up than feedforward supplied. What's the most likely under-tuned gain?",
              options: ["kS too high", "kV too low", "kP too high", "kG missing"],
              answerIndex: 1,
              explanation:
                "If steady-state voltage falls short, kV (volts per unit velocity) is too low — it's the dominant term at speed. Raising it lets feedforward predict the cruise voltage so PID barely has to work.",
            },
            {
              question:
                "A mechanism with good feedforward still buzzes and oscillates around the setpoint. Which change helps most?",
              options: [
                "Increase kS a lot",
                "Lower kP — the feedback term is overreacting to small errors",
                "Remove feedforward entirely",
                "Increase kA",
              ],
              answerIndex: 1,
              explanation:
                "Oscillation around the target is a feedback-tuning symptom: the proportional term is too aggressive. With feedforward already carrying the load, kP can be small.",
            },
          ],
        },
      ],
    },
  ],
};
