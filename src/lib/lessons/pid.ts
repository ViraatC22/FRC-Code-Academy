import type { Lesson } from "../types";

// Exemplar lesson for the educational model. Two principles the rest of the
// curriculum follows:
//  1) READING FIRST, AND DEEP. Each concept section carries real explanation —
//     analogies, the math, FRC-grounded examples, and the common mistakes —
//     not a sentence and a code block.
//  2) TEACH → PRACTICE, INTERLEAVED. Practice lives next to the concept it
//     tests (a quiz/predict/exercise at the end of each concept section), not
//     piled into a single block at the end. Implement & Master come last.
// Runtime-tested code passes gains as PARAMETERS (the interpreter evaluates
// free fields to undefined).

export const pidLesson: Lesson = {
  id: "pid-control",
  title: "PID Control",
  blurb: "Drive a measured value to a target — understand each term deeply, then build real controllers.",
  difficulty: "Hard",
  minutes: 0, // derived from sections
  objectives: [
    "Describe the feedback loop: setpoint, measurement, error, control effort",
    "Explain P, I, and D as a spring, a damper, and accumulated-error memory",
    "Read the discrete PID equation and trace a controller's output by hand",
    "Implement the PD core and a stateful PI velocity controller from scratch",
    "Diagnose a mis-signed controller and tame integral windup",
  ],
  sections: [
    // ── CONCEPT 1: the feedback loop ─────────────────────────────────────────
    {
      kind: "learn",
      title: "The Feedback Loop",
      minutes: 8,
      blurb: "What a controller actually does, 50 times a second.",
      blocks: [
        {
          type: "text",
          md: "Almost everything precise a robot does is **closed-loop control**: spin a flywheel to exactly 5000 RPM, hold an arm at 35°, drive forward exactly 2 meters. In each case the code can't just guess an output and hope — it has to *measure* what's actually happening and keep correcting. That continuous measure-compare-correct cycle is **feedback control**, and **PID** is the controller that runs it.",
        },
        {
          type: "text",
          md: "Every loop (in WPILib, about every 20 ms) a PID controller works with three quantities:\n\n- the **setpoint** (also called the *reference*) — where you want to be, e.g. 5000 RPM\n- the **measurement** (the *process variable*) — where you actually are, read from a sensor\n- the **error** — the gap between them: `error = setpoint − measurement`\n\nFrom that error it computes a **control effort** — the number it sends to the motor — chosen to shrink the error toward zero. Get the sign of the error right and a positive error (you're *below* target) produces a positive (forward) push. Flip it and the controller runs *away* from the target, accelerating the error instead of killing it — one of the most common first bugs.",
        },
        {
          type: "callout",
          tone: "info",
          md: "PID is **reactive**: it only responds to error that already exists. Later you'll pair it with *feedforward*, which predicts the effort needed in advance — together they're how championship mechanisms move fast and land accurately.",
        },
        {
          type: "quiz",
          question: "What is the correct definition of error in a feedback controller?",
          options: [
            "error = measurement − setpoint",
            "error = setpoint − measurement",
            "error = |setpoint| + |measurement|",
            "error = setpoint × measurement",
          ],
          answerIndex: 1,
          explanation:
            "error = setpoint − measurement. With this sign a positive error means you're below the target and the controller pushes forward to close the gap. The opposite sign makes the controller drive away from the setpoint.",
        },
      ],
    },

    // ── CONCEPT 2: proportional ──────────────────────────────────────────────
    {
      kind: "learn",
      title: "Proportional — the spring",
      minutes: 11,
      blurb: "Push in proportion to how far off you are.",
      blocks: [
        {
          type: "text",
          md: "The **proportional** term is the heart of the controller: it commands an output proportional to the current error.\n\n`output = kP · error`\n\nWPILib describes P as a **software-defined spring**. A stretched spring pulls back harder the farther you stretch it; a P controller pushes harder the farther the mechanism is from its target. `kP` is the spring's stiffness — the volts (or percent output) produced per unit of error. Double the error, double the push.",
        },
        {
          type: "text",
          md: "Tuning `kP` is a balance. **Too low** and the mechanism is sluggish and never quite arrives — it gives up while there's still a small error left. **Too high** and it slams into the target with so much momentum that it overshoots, then over-corrects back the other way, oscillating around the setpoint. There's also a subtler limit: P alone almost always leaves a small **steady-state error**. As the mechanism nears the target the error shrinks, so `kP · error` shrinks too — until the push is exactly balanced by friction or gravity and the mechanism stalls *just short*. P can't close that last gap on its own; that's the integral term's job.",
        },
        {
          type: "code",
          lang: "java",
          caption: "Proportional control, by hand",
          code: "double error = setpoint - measurement;\ndouble output = kP * error;\nmotor.set(output);",
        },
        {
          type: "predict",
          prompt: "Trace this single proportional loop. What does it print?",
          code: "double kP = 0.5;\ndouble setpoint = 10.0;\ndouble measurement = 7.0;\n\ndouble error = setpoint - measurement;\ndouble output = kP * error;\nSystem.out.println(output);",
          options: ["1.5", "3.0", "8.5", "0.5"],
          answerIndex: 0,
          explanation: "error = 10 − 7 = 3, output = 0.5 × 3 = 1.5. The farther from target, the larger the push.",
        },
        {
          type: "quiz",
          question: "A mechanism reaches its target but overshoots and then oscillates back and forth around it before settling. Which single change addresses this most directly?",
          options: [
            "Increase kP",
            "Decrease kP (and/or add some derivative)",
            "Increase the setpoint",
            "Reverse the motor",
          ],
          answerIndex: 1,
          explanation:
            "Overshoot-and-oscillate is the classic symptom of too much proportional gain. Lowering kP softens the approach; a derivative term then damps what remains.",
        },
        {
          type: "coding",
          variant: "debug",
          title: "Debugging challenge — the runaway controller",
          prompt:
            "This P controller drives the mechanism *away* from the target — a robot that accelerates the wrong way. The bug is the classic sign error. Fix `pOutput` so it returns the correct proportional output.",
          starter:
            "public double pOutput(double setpoint, double measurement, double kP) {\n    double error = measurement - setpoint;   // bug is on this line\n    return kP * error;\n}",
          solution:
            "public double pOutput(double setpoint, double measurement, double kP) {\n    double error = setpoint - measurement;\n    return kP * error;\n}",
          checks: [
            { label: "Uses the correct sign: setpoint - measurement", pattern: "error\\s*=\\s*setpoint\\s*-\\s*measurement" },
            { label: "Returns kP * error", pattern: "return\\s+kP\\s*\\*\\s*error" },
          ],
          hint: "Flip the subtraction: `error = setpoint - measurement;`. Below target should give a positive push.",
          tests: [
            { method: "pOutput", args: [10.0, 8.0, 0.5], expected: 1.0, tolerance: 1e-9 },
            { method: "pOutput", args: [0.0, 5.0, 0.2], expected: -1.0, tolerance: 1e-9 },
            { method: "pOutput", args: [5.0, 5.0, 0.9], expected: 0.0 },
          ],
        },
      ],
    },

    // ── CONCEPT 3: derivative ────────────────────────────────────────────────
    {
      kind: "learn",
      title: "Derivative — the damper",
      minutes: 11,
      blurb: "React to how fast the error is changing.",
      blocks: [
        {
          type: "text",
          md: "If proportional is a spring, **derivative** is the **shock absorber** bolted next to it. Where P looks at *how far* off you are, D looks at *how fast the error is changing*:\n\n`derivative = (error − previousError) / dt`\n\nWhen the mechanism is racing toward the setpoint, the error is dropping fast, so the derivative is large and negative — and the D term subtracts from the output, easing off the gas *before* you arrive. That's what tames the overshoot a pure-P controller suffers: D anticipates the approach and brakes early. In WPILib's words, it drives the *velocity* error to zero, just as P drives the *position* error to zero.",
        },
        {
          type: "text",
          md: "Derivative has one important hazard: it amplifies **sensor noise**. Because it differentiates the measurement, a jittery encoder reading turns into a wildly jumpy D term that buzzes the motor. That's why teams keep `kD` modest, filter the measurement, or skip D entirely on noisy mechanisms. Rule of thumb: reach for D only after P is dialed in and you're fighting overshoot.",
        },
        {
          type: "quiz",
          question: "Which PID term is most responsible for reducing overshoot?",
          options: ["P — proportional", "I — integral", "D — derivative", "Overshoot can't be controlled"],
          answerIndex: 2,
          explanation:
            "D reacts to the rate of change of error, so it eases off as the mechanism approaches the target — damping the approach. P alone tends to overshoot; I usually makes it worse.",
        },
        {
          type: "coding",
          variant: "exercise",
          title: "Guided exercise — the PD core",
          prompt:
            "Implement a PD controller's per-loop output. Write `double calculate(double setpoint, double measurement, double prevError, double kP, double kD)`: compute `error = setpoint - measurement`, `derivative = error - prevError`, and return `kP*error + kD*derivative`.",
          starter:
            "public double calculate(double setpoint, double measurement, double prevError, double kP, double kD) {\n    double error = setpoint - measurement;\n    // derivative is the change in error since last loop\n    // return the weighted sum of the P and D terms\n}",
          solution:
            "public double calculate(double setpoint, double measurement, double prevError, double kP, double kD) {\n    double error = setpoint - measurement;\n    double derivative = error - prevError;\n    return kP * error + kD * derivative;\n}",
          checks: [
            { label: "Computes error = setpoint - measurement", pattern: "error\\s*=\\s*setpoint\\s*-\\s*measurement" },
            { label: "Computes derivative from the change in error", pattern: "derivative\\s*=\\s*error\\s*-\\s*prevError" },
            { label: "Returns kP*error + kD*derivative", pattern: "kP\\s*\\*\\s*error\\s*\\+\\s*kD\\s*\\*\\s*derivative" },
          ],
          hint: "`double derivative = error - prevError;` then `return kP * error + kD * derivative;`.",
          tests: [
            { method: "calculate", args: [10.0, 8.0, 3.0, 0.5, 0.1], expected: 0.9, tolerance: 1e-9 },
            { method: "calculate", args: [10.0, 10.0, 0.0, 0.5, 0.1], expected: 0.0 },
            { method: "calculate", args: [5.0, 0.0, 0.0, 0.2, 0.0], expected: 1.0, tolerance: 1e-9 },
            { method: "calculate", args: [0.0, 5.0, 0.0, 0.5, 0.0], expected: -2.5, tolerance: 1e-9 },
            { method: "calculate", args: [10.0, 9.0, 2.0, 1.0, 0.5], expected: 0.5, tolerance: 1e-9 },
          ],
        },
      ],
    },

    // ── CONCEPT 4: integral ──────────────────────────────────────────────────
    {
      kind: "learn",
      title: "Integral — the memory",
      minutes: 9,
      blurb: "Accumulate stubborn error until it's gone — carefully.",
      blocks: [
        {
          type: "text",
          md: "The **integral** term is the only one with *memory*. Each loop it adds the current error to a running accumulator:\n\n`integral = integral + error · dt`, and contributes `kI · integral`.\n\nThat's exactly what defeats the steady-state error P leaves behind. As long as *any* error persists, the integral keeps growing, so its contribution keeps climbing until it finally supplies the extra push that closes the last gap — then it holds that output steady. It drives the *total accumulated error over time* to zero.",
        },
        {
          type: "callout",
          tone: "warn",
          md: "That same memory is dangerous, and WPILib explicitly notes **integral gain is generally not recommended for FRC** — most mechanisms are better served by feedforward + P/PD. If error lingers (a stalled mechanism, a saturated output), the accumulator balloons and causes a big overshoot later as it 'unwinds.' This is **integral windup**, and you'll tame it in the Master section.",
        },
        {
          type: "quiz",
          question: "Your mechanism consistently settles a little short of the target and a pure-P controller never closes that last gap. Which term fixes this steady-state error?",
          options: ["P", "I", "D", "It's unavoidable"],
          answerIndex: 1,
          explanation:
            "Near the target the error is small, so kP·error is too weak to overcome friction/gravity and the mechanism stalls short. The integral accumulates that lingering error until the output is finally enough.",
        },
      ],
    },

    // ── CONCEPT 5: the discrete loop + tuning ────────────────────────────────
    {
      kind: "learn",
      title: "Putting It Together",
      minutes: 7,
      blurb: "The full equation, and the order you tune it.",
      blocks: [
        {
          type: "text",
          md: "Stacked together, the three terms form the controller WPILib runs for you each loop:\n\n`output = kP·error + kI·∫error + kD·(d error / dt)`\n\nThe P term scales with *current* error, I with the *accumulated history* of error, and D with the *rate of change* of error. `controller.calculate(measurement, setpoint)` packages all of that; understanding what's inside is what lets you tune it instead of guessing.",
        },
        {
          type: "callout",
          tone: "tip",
          md: "Tune in this order: bring **P** up until the mechanism reaches the target but oscillates slightly → add a little **D** to settle it → reach for **I** last and sparingly, only if a steady-state error remains. Always **clamp the output** to the legal motor range before applying it.",
        },
        {
          type: "quiz",
          question: "You're tuning a brand-new mechanism from scratch. Which gain do you raise first?",
          options: ["I", "D", "P", "All three together"],
          answerIndex: 2,
          explanation: "Start with P alone to get the basic response, then add D to damp overshoot, then I last and sparingly.",
        },
      ],
    },

    // ── IMPLEMENT ────────────────────────────────────────────────────────────
    {
      kind: "implement",
      title: "Implement — Shooter Velocity Controller",
      minutes: 12,
      blurb: "Build a real subsystem controller, tested across a control loop.",
      blocks: [
        {
          type: "text",
          md: "Time to build something a real robot fires with. A **shooter** spins a flywheel up to a target RPM before launching a game piece. Velocity control is a textbook fit for **PI**: P reacts to the current speed error, and I supplies the *steady* output needed to hold RPM against friction once the error reaches zero — a pure-P controller would sag back the instant the error vanished.\n\nYour controller stores `kP`, `kI`, and a running `integral`, and exposes `calculate(targetRpm, measuredRpm)` to be called every loop. Watch the third test: at the target, P drops to zero but the integral *holds* the output. That's the whole reason velocity loops use I.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Implementation lab — shooter velocity controller",
          prompt:
            "Implement `ShooterController`. It stores `kP`, `kI`, and a running `integral` (starts at 0). Complete `calculate(double targetRpm, double measuredRpm)`: compute `error = targetRpm - measuredRpm`, add `error` to `integral`, and return `kP*error + kI*integral`. The tests drive one controller across several loops toward 100 RPM.",
          starter:
            "public class ShooterController {\n    private double kP;\n    private double kI;\n    private double integral = 0;\n\n    public ShooterController(double kP, double kI) {\n        this.kP = kP;\n        this.kI = kI;\n    }\n\n    public double calculate(double targetRpm, double measuredRpm) {\n        // error, accumulate into integral, then return kP*error + kI*integral\n    }\n}",
          solution:
            "public class ShooterController {\n    private double kP;\n    private double kI;\n    private double integral = 0;\n\n    public ShooterController(double kP, double kI) {\n        this.kP = kP;\n        this.kI = kI;\n    }\n\n    public double calculate(double targetRpm, double measuredRpm) {\n        double error = targetRpm - measuredRpm;\n        integral += error;\n        return kP * error + kI * integral;\n    }\n}",
          checks: [
            { label: "Computes error = targetRpm - measuredRpm", pattern: "error\\s*=\\s*targetRpm\\s*-\\s*measuredRpm" },
            { label: "Accumulates error into the integral", pattern: "integral\\s*\\+=\\s*error|integral\\s*=\\s*integral\\s*\\+\\s*error" },
            { label: "Returns kP*error + kI*integral", pattern: "kP\\s*\\*\\s*error\\s*\\+\\s*kI\\s*\\*\\s*integral" },
          ],
          hint: "Three lines: `double error = targetRpm - measuredRpm;`, `integral += error;`, `return kP * error + kI * integral;`.",
          stateTests: [
            {
              className: "ShooterController",
              ctorArgs: [0.01, 0.001],
              label: "spin up to 100 RPM and hold",
              steps: [
                { method: "calculate", args: [100.0, 0.0], expected: 1.1, tolerance: 1e-9, label: "cold start: big P + small I → 1.1" },
                { method: "calculate", args: [100.0, 60.0], expected: 0.54, tolerance: 1e-9, label: "spinning up → 0.54" },
                { method: "calculate", args: [100.0, 100.0], expected: 0.14, tolerance: 1e-9, label: "at speed: P=0, integral HOLDS output → 0.14" },
              ],
            },
          ],
        },
      ],
    },

    // ── MASTER ───────────────────────────────────────────────────────────────
    {
      kind: "master",
      title: "Master — Tame Integral Windup",
      minutes: 12,
      blurb: "Defeat windup, then prove you can reason about a full controller.",
      blocks: [
        {
          type: "text",
          md: "Your shooter controller has a hidden flaw — the windup warned about earlier. While the flywheel is still spinning up (or if it jams), error persists and the integral keeps *accumulating*. By the time the motor catches up, that ballooned integral drives a big overshoot as it 'unwinds.' The simplest robust fix is to **clamp the integrator** to a maximum magnitude, so its stored energy can never run away.\n\nBuild a controller that caps its own integral within `[-maxIntegral, maxIntegral]` every loop. The tests push a large, persistent error and confirm the integral saturates instead of exploding.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Mastery lab — anti-windup controller",
          prompt:
            "Implement `ClampedController` with fields `kP`, `kI`, `maxIntegral`, and a running `integral` (starts at 0). In `calculate(double error)`: add `error` to `integral`; if `integral > maxIntegral` set it to `maxIntegral`; if `integral < -maxIntegral` set it to `-maxIntegral`; then return `kP*error + kI*integral`. The tests use kP=0 to isolate the integral and verify it saturates.",
          starter:
            "public class ClampedController {\n    private double kP;\n    private double kI;\n    private double maxIntegral;\n    private double integral = 0;\n\n    public ClampedController(double kP, double kI, double maxIntegral) {\n        this.kP = kP;\n        this.kI = kI;\n        this.maxIntegral = maxIntegral;\n    }\n\n    public double calculate(double error) {\n        // accumulate, clamp the integral to [-maxIntegral, maxIntegral], then return the output\n    }\n}",
          solution:
            "public class ClampedController {\n    private double kP;\n    private double kI;\n    private double maxIntegral;\n    private double integral = 0;\n\n    public ClampedController(double kP, double kI, double maxIntegral) {\n        this.kP = kP;\n        this.kI = kI;\n        this.maxIntegral = maxIntegral;\n    }\n\n    public double calculate(double error) {\n        integral += error;\n        if (integral > maxIntegral) {\n            integral = maxIntegral;\n        }\n        if (integral < -maxIntegral) {\n            integral = -maxIntegral;\n        }\n        return kP * error + kI * integral;\n    }\n}",
          checks: [
            { label: "Accumulates error into the integral", pattern: "integral\\s*\\+=\\s*error|integral\\s*=\\s*integral\\s*\\+\\s*error" },
            { label: "Clamps the upper bound", pattern: "integral\\s*>\\s*maxIntegral" },
            { label: "Clamps the lower bound", pattern: "integral\\s*<\\s*-\\s*maxIntegral" },
            { label: "Returns kP*error + kI*integral", pattern: "kP\\s*\\*\\s*error\\s*\\+\\s*kI\\s*\\*\\s*integral" },
          ],
          hint: "After `integral += error;`, guard both directions: `if (integral > maxIntegral) { integral = maxIntegral; }` and the mirror for the negative bound.",
          stateTests: [
            {
              className: "ClampedController",
              ctorArgs: [0.0, 0.1, 10.0],
              label: "persistent error: integral saturates instead of winding up",
              steps: [
                { method: "calculate", args: [5.0], expected: 0.5, tolerance: 1e-9, label: "integral 5 → 0.5" },
                { method: "calculate", args: [5.0], expected: 1.0, tolerance: 1e-9, label: "integral 10 → 1.0" },
                { method: "calculate", args: [5.0], expected: 1.0, tolerance: 1e-9, label: "would be 15, clamped to 10 → still 1.0 (no windup)" },
                { method: "calculate", args: [5.0], expected: 1.0, tolerance: 1e-9, label: "stays saturated → 1.0" },
                { method: "calculate", args: [-30.0], expected: -1.0, tolerance: 1e-9, label: "swings negative, clamps at -10 → -1.0" },
              ],
            },
          ],
        },
        {
          type: "knowledgeCheck",
          title: "Mastery check — diagnosis",
          questions: [
            {
              question:
                "After a large disturbance your mechanism overshoots badly and recovers slowly, and the integral seems 'stuck' high. Most likely cause?",
              options: [
                "Proportional gain too low",
                "Integral windup — the integrator accumulated while error persisted; clamp the output or the integrator",
                "Derivative gain is negative",
                "Setpoint too close to zero",
              ],
              answerIndex: 1,
              explanation:
                "While error persists (e.g. output saturated), the integral grows. When the system finally responds, the stored-up integral causes overshoot as it unwinds. Clamping the integrator or output prevents it.",
            },
            {
              question:
                "A velocity controller holds the target perfectly but takes too long to get there, lagging well behind commanded speed. Most direct fix?",
              options: [
                "Lower kI",
                "Raise kP so it pushes harder while error is large",
                "Remove the D term",
                "Lower the setpoint",
              ],
              answerIndex: 1,
              explanation:
                "Slow approach with a correct final value points at too little proportional authority. Raising kP increases the push during the large-error phase; the integral is already handling steady state.",
            },
          ],
        },
      ],
    },
  ],
};
