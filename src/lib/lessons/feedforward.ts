import type { Lesson } from "../types";

// Feedforward — same format as the PID exemplar: deep reading, and practice
// interleaved after each concept (teach → practice), then Implement & Master.
// Runtime-tested exercises pass gains as PARAMETERS (the interpreter evaluates
// free fields to undefined).

export const feedforwardLesson: Lesson = {
  id: "feedforward",
  title: "Feedforward",
  blurb: "Predict the voltage a mechanism needs — model the physics, then build it.",
  difficulty: "Hard",
  minutes: 0, // derived from sections
  objectives: [
    "Explain why feedforward is predictive where PID is reactive",
    "State what kS, kV, kA, and kG each model physically",
    "Compute the kS·sgn(v) + kV·v + kA·a model by hand",
    "Find and fix a feedforward that fails to overcome static friction",
    "Build a flywheel controller that fuses feedforward with PID feedback",
  ],
  sections: [
    // ── CONCEPT 1: predict, don't react ──────────────────────────────────────
    {
      kind: "learn",
      title: "Predict, Don't React",
      minutes: 7,
      blurb: "Why model the physics instead of waiting for error.",
      blocks: [
        {
          type: "text",
          md: "PID is **reactive** — it does nothing until an error already exists, then scrambles to correct it. That's fine for holding a position, but it's always a step behind: to make a flywheel reach 5000 RPM, a pure-PID loop has to *see* the speed deficit before it responds, so it lags.\n\n**Feedforward** flips the approach. Instead of reacting to error, it uses a **physical model** of the mechanism to compute the voltage you already know it will need — *before* any error appears. If you know a flywheel needs 6 volts to spin at 5000 RPM, why wait for a controller to discover that? Feed those 6 volts forward immediately and the mechanism is at speed almost at once.",
        },
        {
          type: "text",
          md: "The two aren't rivals — they're partners. Real mechanisms pair them: **feedforward does the heavy lifting** (supplying the bulk of the voltage the physics demands) while **PID cleans up the small remainder** (modeling error, battery sag, a stiff bearing). This is why championship velocity and motion control feels both fast *and* accurate where pure PID feels like one or the other.",
        },
        {
          type: "quiz",
          question: "What is the key difference between feedforward and PID?",
          options: [
            "Feedforward predicts the needed effort; PID reacts to measured error",
            "They are two names for the same thing",
            "Feedforward only works on arms",
            "PID is predictive; feedforward is reactive",
          ],
          answerIndex: 0,
          explanation:
            "Feedforward uses a physical model to anticipate the required output; PID corrects whatever error remains. Combined, they outperform either alone.",
        },
      ],
    },

    // ── CONCEPT 2: kS and kV ─────────────────────────────────────────────────
    {
      kind: "learn",
      title: "kS and kV — Friction and Speed",
      minutes: 10,
      blurb: "The two terms that carry a steady-velocity mechanism.",
      blocks: [
        {
          type: "text",
          md: "A simple motor feedforward is built from gains you *measure* (with a characterization tool like SysId) rather than guess. The first two:\n\n- **kS** — the **static** gain: the voltage needed just to *break friction and start moving*. It's a fixed push, applied in the direction of motion — which is why it's multiplied by `Math.signum(v)` (the sign of velocity: +1 forward, −1 reverse, 0 stopped), not by the velocity itself.\n- **kV** — the **velocity** gain: the volts needed *per unit of velocity*. This is the dominant term once a mechanism is up to speed — most of the voltage holding a flywheel at 5000 RPM is `kV · 5000`.",
        },
        {
          type: "text",
          md: "So a static-plus-velocity feedforward is:\n\n`u = kS · sgn(v) + kV · v`\n\nNotice the consequence of `sgn(v)`: at `v = 0` it's `0`, so a stopped mechanism with no commanded motion gets *zero* feedforward — correct, there's nothing to overcome yet. A subtle but common bug is multiplying kS by velocity instead of its sign; then the static term vanishes at low speed and the mechanism sticks instead of starting.",
        },
        {
          type: "predict",
          prompt: "With kS = 0.2 and kV = 2.5, what voltage does this print for a target velocity of 2.0?",
          code: "double kS = 0.2;\ndouble kV = 2.5;\ndouble vel = 2.0;\n\ndouble volts = kS * Math.signum(vel) + kV * vel;\nSystem.out.println(volts);",
          options: ["5.2", "5.0", "5.4", "2.7"],
          answerIndex: 0,
          explanation: "kS·sgn(2.0) = 0.2×1 = 0.2, kV·v = 2.5×2.0 = 5.0, total 5.2.",
        },
        {
          type: "coding",
          variant: "exercise",
          title: "Guided exercise — kS + kV by hand",
          prompt:
            "Implement a static+velocity feedforward. Write `double volts(double kS, double kV, double vel)` returning `kS * Math.signum(vel) + kV * vel`.",
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
      ],
    },

    // ── CONCEPT 3: kA and kG ─────────────────────────────────────────────────
    {
      kind: "learn",
      title: "kA and kG — Acceleration and Gravity",
      minutes: 9,
      blurb: "The terms for fast changes and fighting gravity.",
      blocks: [
        {
          type: "text",
          md: "Two more gains complete the picture:\n\n- **kA** — the **acceleration** gain: extra volts per unit of *acceleration*. It only matters while the commanded velocity is *changing* — accelerating a heavy flywheel takes more voltage than holding it. At steady speed (a = 0) this term is zero, so many teams leave kA small or zero for low-inertia mechanisms.\n- **kG** — the **gravity** gain (arms and elevators only): the voltage to *hold position against gravity*, even at zero speed. An arm held out horizontally sags without it; a flywheel, whose axis is gravity-neutral, never needs it.\n\nThe gains layer onto the model you already have. For a flywheel: `u = kS·sgn(v) + kV·v + kA·a`. For an arm you'd add a `kG` term for the holding voltage.",
        },
        {
          type: "quiz",
          question: "In SimpleMotorFeedforward(kS, kV, kA), which gain is the voltage needed just to overcome static friction and start moving?",
          options: ["kV", "kS", "kA", "Friction isn't modeled"],
          answerIndex: 1,
          explanation: "kS is the static gain — applied in the direction of travel to break friction. kV scales with velocity, kA with acceleration.",
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

    // ── CONCEPT 4: volts, not percent ────────────────────────────────────────
    {
      kind: "learn",
      title: "Volts, Not Percent",
      minutes: 5,
      blurb: "Why feedforward and setVoltage go together.",
      blocks: [
        {
          type: "text",
          md: "Feedforward gains are measured in **volts**, so you apply them with `motor.setVoltage(...)`, not `motor.set(...)` (percent output). The reason is the battery. A FRC battery sags from ~13 V at rest toward 11 V or less under heavy load, so `motor.set(0.5)` means a *different physical effort* depending on the moment. Voltage is absolute: `setVoltage(6.0)` commands the controller to deliver 6 volts regardless of battery state. Since your model predicts an effort in volts, applying it in volts keeps the prediction honest.",
        },
        {
          type: "code",
          lang: "java",
          caption: "WPILib packages the model; you feed it the commanded motion",
          code: "SimpleMotorFeedforward ff = new SimpleMotorFeedforward(0.2, 2.5, 0.1);\n\ndouble volts = ff.calculate(targetVelocity);\nmotor.setVoltage(volts);   // absolute volts, immune to battery sag",
        },
        {
          type: "quiz",
          question: "Why pair feedforward with setVoltage() rather than set() (percent output)?",
          options: [
            "setVoltage is faster",
            "Voltage is consistent as the battery sags, so a command means the same physical effort",
            "set() doesn't work with feedforward",
            "It uses less CAN bandwidth",
          ],
          answerIndex: 1,
          explanation:
            "Percent output drifts with battery voltage; volts are an absolute, physics-based unit — which is exactly what the model predicts.",
        },
      ],
    },

    // ── IMPLEMENT ────────────────────────────────────────────────────────────
    {
      kind: "implement",
      title: "Implement — Full Motor Feedforward",
      minutes: 12,
      blurb: "Build the complete kS/kV/kA model a real flywheel runs every loop.",
      blocks: [
        {
          type: "text",
          md: "Now assemble the complete model. A flywheel shooter commands a *target velocity and acceleration* each loop (from a motion profile, in the next lessons), and feedforward returns the voltage physics predicts — before PID touches the small remainder. Implement `u = kS·sgn(v) + kV·v + kA·a` as a pure function of its gains and the commanded motion.",
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

    // ── MASTER ───────────────────────────────────────────────────────────────
    {
      kind: "master",
      title: "Master — Feedforward + PID",
      minutes: 12,
      blurb: "Fuse predictive feedforward with reactive PID, then reason about tuning.",
      blocks: [
        {
          type: "text",
          md: "This is how championship velocity control actually works: **feedforward predicts, PID corrects.** Feedforward supplies `kS·sgn(target) + kV·target` to get the flywheel near the right speed instantly; a proportional term then nudges out the small remaining error from `target − measured` (battery sag, a stiff bearing, model imperfection). Build the combined output as one function and watch the second test: at speed, feedforward holds the output and the proportional correction is zero.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Mastery lab — feedforward + PID flywheel",
          prompt:
            "Write `double flywheel(double kS, double kV, double kP, double targetVel, double measuredVel)` returning the feedforward `kS*Math.signum(targetVel) + kV*targetVel` plus the proportional correction `kP*(targetVel - measuredVel)`.",
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
                "Your flywheel reaches the target but takes a moment to get there, and the recording shows it needed more voltage during spin-up than feedforward supplied. Most likely under-tuned gain?",
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
                "Oscillation around the target is a feedback-tuning symptom: the proportional term is too aggressive. With feedforward carrying the load, kP can be small.",
            },
          ],
        },
      ],
    },
  ],
};
