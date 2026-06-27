import type { Lesson } from "../types";

// Exemplar lesson for the redesigned educational model: every topic follows
// Learn → Practice → Implement → Master, with tiered assessment (knowledge
// check → guided/debug exercises → implementation labs) and runtime-tested
// "Implement" work that mirrors a real FRC problem. Use this as the template
// when migrating the rest of the curriculum.

export const pidLesson: Lesson = {
  id: "pid-control",
  title: "PID Control",
  blurb: "Drive a measured value to a target — understand the math, then build real controllers.",
  difficulty: "Hard",
  minutes: 0, // derived from sections (see lessonMinutes)
  objectives: [
    "Explain what the P, I, and D terms each contribute to a controller's response",
    "Trace and predict a discrete PID controller's output by hand",
    "Implement the PD core and a stateful PI controller from scratch",
    "Diagnose and fix a mis-signed / unstable controller",
    "Build a shooter velocity controller and add anti-windup to prevent overshoot",
  ],
  sections: [
    // ── LEARN ──────────────────────────────────────────────────────────────
    {
      kind: "learn",
      minutes: 12,
      blurb: "What each term does, and the exact math a controller runs every loop.",
      blocks: [
        {
          type: "text",
          md: "**PID** is the workhorse of robot control. Given a **setpoint** (where you want to be) and a **measurement** (where you are), a PID controller computes a motor output that shrinks the error to zero. The three terms each answer a different question:\n\n- **P** (proportional) — *how far off am I right now?* Push harder the farther you are.\n- **I** (integral) — *have I been off for a while?* Correct stubborn, lingering error.\n- **D** (derivative) — *how fast am I closing in?* Damp the approach so you don't overshoot.",
        },
        {
          type: "text",
          md: "Calling `controller.calculate()` is convenient, but the math is not magic. Once per loop (every `dt` seconds) a discrete PID controller computes:\n\n`error = setpoint − measurement`\n\n`integral = integral + error · dt`\n\n`derivative = (error − previousError) / dt`\n\n`output = kP·error + kI·integral + kD·derivative`\n\nThe P term scales with *current* error, I with the *accumulated history* of error, and D with the *rate of change* of error — which is why D predicts and damps overshoot.",
        },
        {
          type: "code",
          lang: "java",
          caption: "WPILib's PIDController packages that loop for you",
          code: "PIDController controller = new PIDController(0.1, 0.0, 0.02);\ncontroller.setTolerance(0.02);   // within 2 cm counts as \"there\"\n\n// each loop: measure, compute, apply\ndouble output = controller.calculate(encoder.getDistance(), setpoint);\nmotor.set(output);\n\nif (controller.atSetpoint()) {\n    motor.set(0);\n}",
        },
        {
          type: "callout",
          tone: "tip",
          md: "Tune in this order: raise **P** until the mechanism reaches the target but oscillates slightly, add a little **D** to settle it, and reach for **I** last and sparingly — it's the term most likely to cause instability.",
        },
        {
          type: "callout",
          tone: "warn",
          md: "PID math can return values well outside `[-1, 1]`. Always **clamp the output** to the legal motor range before applying it — feeding raw values to a motor wastes headroom and worsens windup (more on that in Master).",
        },
      ],
    },

    // ── PRACTICE ───────────────────────────────────────────────────────────
    {
      kind: "practice",
      minutes: 18,
      blurb: "Check your understanding, trace code by hand, then write and repair controllers.",
      blocks: [
        {
          type: "knowledgeCheck",
          title: "Knowledge check — the three terms",
          questions: [
            {
              question: "Which term is most responsible for reducing overshoot?",
              options: ["P — proportional", "I — integral", "D — derivative", "Overshoot can't be controlled"],
              answerIndex: 2,
              explanation:
                "D reacts to how fast the error is changing, damping the approach. P alone tends to overshoot, and I can make it worse.",
            },
            {
              question: "Your mechanism stops just short of the target and never quite reaches it. Which term fixes this steady-state error?",
              options: ["P", "I", "D", "None — it's unavoidable"],
              answerIndex: 1,
              explanation:
                "A small constant error leaves P producing a too-small push. The integral accumulates that lingering error until the output is enough to close the gap.",
            },
            {
              question: "In the discrete loop, what is the derivative term proportional to?",
              options: [
                "The current error",
                "The sum of all past errors",
                "The change in error since the last loop",
                "The setpoint",
              ],
              answerIndex: 2,
              explanation:
                "derivative = (error − previousError) / dt — the rate of change of error. That's why it anticipates and damps fast approaches.",
            },
            {
              question: "What is the correct sign convention for error?",
              options: [
                "error = measurement − setpoint",
                "error = setpoint − measurement",
                "error = |setpoint − measurement|",
                "error = setpoint + measurement",
              ],
              answerIndex: 1,
              explanation:
                "error = setpoint − measurement. With this sign, a positive error means 'below target' and produces a positive (forward) push. Flip it and the controller drives away from the target.",
            },
            {
              question: "You start tuning a brand-new mechanism. Which gain do you bring up first?",
              options: ["I", "D", "P", "All three at once"],
              answerIndex: 2,
              explanation:
                "Start with P alone to get the basic response, then add D to settle, then I last and sparingly.",
            },
          ],
        },
        {
          type: "predict",
          prompt: "Trace this single P-controller loop. What does it print?",
          code: "double kP = 0.5;\ndouble setpoint = 10.0;\ndouble measurement = 7.0;\n\ndouble error = setpoint - measurement;\ndouble output = kP * error;\nSystem.out.println(output);",
          options: ["1.5", "3.0", "8.5", "0.5"],
          answerIndex: 0,
          explanation:
            "error = 10 − 7 = 3, and output = 0.5 × 3 = 1.5. The farther from target, the larger the push.",
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
        {
          type: "coding",
          variant: "debug",
          title: "Debugging challenge — the runaway controller",
          prompt:
            "This P controller drives the mechanism *away* from the target instead of toward it — a robot that accelerates the wrong way. The bug is a classic sign error. Fix `pOutput` so it returns the correct proportional output.",
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

    // ── IMPLEMENT ──────────────────────────────────────────────────────────
    {
      kind: "implement",
      minutes: 16,
      blurb: "Build a real subsystem controller from scratch, tested across a control loop.",
      blocks: [
        {
          type: "text",
          md: "Time to build something a real robot uses. A **shooter** spins a flywheel to a target RPM before firing. Velocity control is a perfect fit for **PI**: P reacts to the current speed error, and I supplies the *steady* output the motor needs to hold RPM against friction once the error reaches zero (a pure-P controller would sag back the instant error vanishes).\n\nYour controller stores `kP`, `kI`, and a running `integral`, and exposes `calculate(targetRpm, measuredRpm)` to be called every loop. Watch what happens at the target: P drops to zero but the integral *holds* the output — that's the whole point.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Implementation lab — shooter velocity controller",
          prompt:
            "Implement `ShooterController`. It stores `kP`, `kI`, and a running `integral` (starts at 0). Complete `calculate(double targetRpm, double measuredRpm)`: compute `error = targetRpm - measuredRpm`, add `error` to `integral`, and return `kP*error + kI*integral`. The tests drive one controller across several loops toward 100 RPM and check that the integral holds the output once the flywheel is up to speed.",
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

    // ── MASTER ─────────────────────────────────────────────────────────────
    {
      kind: "master",
      minutes: 14,
      blurb: "Defeat integral windup, then prove you can reason about a full controller.",
      blocks: [
        {
          type: "text",
          md: "Your shooter controller has a hidden flaw. **Integral windup**: while the flywheel is still spinning up (or if it stalls), error persists and the integral keeps *accumulating*. By the time the motor catches up, that ballooned integral drives a big overshoot as it 'unwinds.' The simplest robust fix is to **clamp the integrator** to a maximum magnitude, so its stored energy can never run away.\n\nBuild a controller that caps its own integral in `[-maxIntegral, maxIntegral]` every loop. The tests push a large, persistent error and confirm the integral saturates instead of exploding.",
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
                "A velocity controller holds the target perfectly but takes too long to get there, lagging well behind commanded speed. What's the most direct fix?",
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
