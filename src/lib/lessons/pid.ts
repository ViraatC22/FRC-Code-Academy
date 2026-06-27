import type { Lesson } from "../types";

// Exemplar lesson for the educational model. Principles every lesson follows:
//  1) READING FIRST, AND DEEP — explain the WHY, not just the what: analogies,
//     the math, multiple worked examples, and FRC scenarios, enough that a
//     learner with no prior knowledge leaves with real conceptual grip.
//  2) TEACH → PRACTICE, INTERLEAVED — practice sits at the end of the concept
//     section it tests; Implement & Master come last.
// Content is grounded only in the WPILib docs (advanced-controls: intro-to-pid,
// pidcontroller) and the Lynk Robotics programming curriculum. Runtime-tested
// code passes gains as PARAMETERS (the interpreter evaluates free fields to
// undefined).

export const pidLesson: Lesson = {
  id: "pid-control",
  title: "PID Control",
  blurb: "Drive a measured value to a target — understand each term deeply, then build real controllers.",
  difficulty: "Hard",
  minutes: 0, // derived from sections
  objectives: [
    "Explain why closed-loop (feedback) control is needed and how the loop works",
    "Describe P, I, and D as a spring, a damper, and accumulated-error memory — and why each behaves that way",
    "Recognize underdamped, overdamped, and critically damped responses and what they mean for tuning",
    "Read the discrete PID equation and trace a controller's output by hand",
    "Implement a PD core and a stateful PI velocity controller, and tame integral windup",
  ],
  sections: [
    // ── CONCEPT 1: the feedback loop ─────────────────────────────────────────
    {
      kind: "learn",
      title: "Why Feedback Control",
      minutes: 12,
      blurb: "What a controller does, and why open-loop guessing fails.",
      blocks: [
        {
          type: "text",
          md: "Suppose you want a flywheel at exactly 5000 RPM. The naive approach is **open-loop**: you guess that, say, 70% output gets you there, and you set it. The problem is that the *right* output is never a fixed number. A fresh battery spins the wheel faster than a drained one. A cold gearbox has more friction than a warm one. A game piece touching the wheel drags it down. Open-loop control has no way to notice any of this — it commands the same 70% whether the wheel is at 4000 RPM or 5500, and the speed drifts wherever physics takes it.",
        },
        {
          type: "text",
          md: "**Closed-loop control** fixes this by adding a sensor and a correction. Every loop the code *measures* the real speed, compares it to the target, and adjusts the output to shrink the gap. Spinning slow? Push harder. Overshooting? Ease off. Because it reacts to what's actually happening, it holds the target through battery sag, friction, and disturbances. **PID** is the controller that runs this measure–compare–correct cycle, and it's the workhorse behind nearly every precise mechanism on an FRC robot.",
        },
        {
          type: "text",
          md: "WPILib frames the loop with three quantities, run roughly every 20 ms:\n\n- the **setpoint** (the *reference*, written `r(t)`) — where you want to be: 5000 RPM, 35° of arm angle, 2 m down the field\n- the **measurement** (the *process variable*, `y(t)`) — where you actually are, read from a sensor\n- the **error** (`e(t)`) — the difference between them: `e(t) = r(t) − y(t)`, i.e. `error = setpoint − measurement`\n\nFrom that error the controller computes a **control effort** `u(t)` — the number sent to the motor — chosen to push the error toward zero.",
        },
        {
          type: "callout",
          tone: "warn",
          md: "The error's **sign convention** matters enormously. With `error = setpoint − measurement`, being *below* target gives a *positive* error and a positive (forward) push — correct. Flip the subtraction and a below-target mechanism gets a *negative* command, driving it further away and accelerating the error. A reversed sign (here or in a motor inversion) is the single most common reason a new control loop 'explodes' instead of converging.",
        },
        {
          type: "text",
          md: "The same loop powers very different mechanisms — only the setpoint and sensor change:\n\n- **Flywheel shooter** — setpoint is RPM, sensor is the encoder's velocity; hold a constant speed.\n- **Arm or elevator** — setpoint is an angle or height, sensor is an encoder; move to a position and hold it against gravity.\n- **Drive-to-distance** — setpoint is meters, sensor is the drive encoders; roll forward an exact distance in autonomous.\n- **Turn-to-heading / turret** — setpoint is an angle, sensor is the gyro; rotate to face a target.\n\nLearn the loop once and it transfers to all of them.",
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
            "error = setpoint − measurement (r(t) − y(t)). A positive error then means you're below target and the controller pushes forward to close the gap; the opposite sign drives the mechanism away from the setpoint.",
        },
      ],
    },

    // ── CONCEPT 2: proportional ──────────────────────────────────────────────
    {
      kind: "learn",
      title: "Proportional — the Software Spring",
      minutes: 14,
      blurb: "Push in proportion to how far off you are — and why that leaves a gap.",
      blocks: [
        {
          type: "text",
          md: "The **proportional** term is the core of the controller. It commands an output proportional to the current error:\n\n`output = kP · error`\n\nWPILib's analogy is a **software-defined spring**. A real spring obeys `F = −kx`: pull it twice as far from rest and it pulls back twice as hard. A P controller does exactly this with error in place of displacement — the farther the mechanism is from its setpoint, the harder it drives back toward it. `kP` is the spring's *stiffness*: the amount of output produced per unit of error.",
        },
        {
          type: "text",
          md: "A worked example makes it concrete. Say an arm's setpoint is 90° and `kP = 0.02` (output per degree). At 30° the error is 60°, so the output is `0.02 × 60 = 1.2` — clamped to full power, the arm drives hard. At 80° the error is only 10°, so the output drops to `0.02 × 10 = 0.2` — a gentle nudge as it nears the target. The push automatically tapers as the arm closes in. That self-scaling is exactly what you want, and it's why P is the term you always start with.",
        },
        {
          type: "text",
          md: "Tuning `kP` is a balancing act between two failure modes:\n\n- **Too low** — the mechanism is sluggish, creeps toward the target, and may stall out before arriving. The spring is too weak.\n- **Too high** — the mechanism charges the target with so much momentum that it sails past, then over-corrects back the other way, **oscillating** around the setpoint instead of settling. The spring is too stiff. (You'll meet the formal name for this behavior — *underdamped* — shortly.)",
        },
        {
          type: "text",
          md: "There's also a subtler limit that pure P can never escape: **steady-state error**. As the mechanism approaches the target the error shrinks, so `kP · error` shrinks with it — until the remaining push is too small to overcome the friction or gravity still acting on the mechanism, and it stalls *just short* of the target. Picture the arm at 88°: the 2° error gives only `0.02 × 2 = 0.04` output, not enough to lift the arm's weight the final degrees, so it hangs there forever. P alone *cannot* close that last gap — fixing it is the job of the integral term (or, better in FRC, feedforward).",
        },
        {
          type: "code",
          lang: "java",
          caption: "Proportional control, by hand",
          code: "double error = setpoint - measurement;   // r(t) - y(t)\ndouble output = kP * error;\nmotor.set(output);",
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
          question: "An arm with only a P controller consistently stops a few degrees below its target and never quite reaches it. Why does pure proportional control do this?",
          options: [
            "kP is negative",
            "Near the target the error is small, so kP·error becomes too weak to overcome gravity/friction — steady-state error",
            "The encoder is broken",
            "Proportional control always overshoots, never undershoots",
          ],
          answerIndex: 1,
          explanation:
            "As error shrinks the proportional push shrinks too, until it can no longer overcome the constant load. The mechanism stalls just short — steady-state error that P alone can't remove.",
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
      title: "Derivative — the Software Damper",
      minutes: 13,
      blurb: "React to how fast the error is changing, to brake before you arrive.",
      blocks: [
        {
          type: "text",
          md: "If proportional is a spring, **derivative** is the **shock absorber** bolted alongside it. Where P reacts to *how far* off you are, D reacts to *how fast the error is changing*:\n\n`derivative = (error − previousError) / dt`\n\nWPILib gives the deeper insight: a PD controller is really *two* proportional controllers at once — a proportional controller on **position** (the P term, kP) and a proportional controller on **velocity** (the D term, kD). When the setpoint is constant, its implicit velocity setpoint is zero, so the D term works to drive the mechanism's *velocity* to zero. In plain terms: if the mechanism is moving fast, D pushes back against that motion — a software-defined damper.",
        },
        {
          type: "text",
          md: "This is what cures the overshoot a pure-P controller suffers. Imagine the arm sprinting toward 90°. With P only, it arrives at full speed and barrels past. Add D: as the arm races in, the error is dropping quickly, so `(error − previousError)` is large and negative, and the D term *subtracts* from the output — easing off the gas *before* the arm reaches the target. D anticipates the approach and brakes early, so the arm glides into the setpoint instead of slamming into it. The `dt` is the time between loops (about 20 ms in WPILib); it converts the change in error into a rate.",
        },
        {
          type: "callout",
          tone: "warn",
          md: "Derivative's hazard is **sensor noise**. Because it differentiates the measurement, a jittery encoder reading becomes a wildly jumpy D term that buzzes the motor and can make things *worse*. That's why teams keep `kD` modest, filter the sensor, or skip D entirely on noisy mechanisms. Practical order: get P working first, then add just enough D to kill overshoot.",
        },
        {
          type: "quiz",
          question: "Which PID term is most responsible for reducing overshoot, and why?",
          options: [
            "P, because it pushes harder",
            "I, because it accumulates error",
            "D, because it reacts to the rate of change of error and eases off as the mechanism approaches the target",
            "None — overshoot can't be controlled",
          ],
          answerIndex: 2,
          explanation:
            "D responds to how fast the error is shrinking, so it brakes the approach before arrival. P alone tends to overshoot; I usually makes overshoot worse.",
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
      title: "Integral — the Memory",
      minutes: 11,
      blurb: "Accumulate stubborn error until it's gone — and why FRC is wary of it.",
      blocks: [
        {
          type: "text",
          md: "The **integral** term is the only one with *memory*. Each loop it adds the current error to a running accumulator, and contributes in proportion to that sum:\n\n`integral = integral + error · dt`, contributing `kI · integral`.\n\nThis is the cure for the steady-state error P leaves behind. Recall the arm hanging at 88°: with P alone the 2° error is too weak to lift it. But integral *remembers*. Every loop it adds that 2° to its accumulator, so its contribution grows — loop after loop — until the total output is finally enough to nudge the arm the last 2°. WPILib's phrasing: the integral 'increases the control effort until the system converges.' It drives the *total accumulated error over time* to zero.",
        },
        {
          type: "callout",
          tone: "warn",
          md: "That same memory is dangerous, and WPILib explicitly states **integral gain is generally not recommended for FRC** — 'it is almost always better to use a feedforward controller to eliminate steady-state error.' Two failure modes: too much kI causes overshoot, and a lingering error (a stalled mechanism, or an output already maxed out) lets the accumulator balloon and 'unwind' into a large overshoot later. That runaway accumulation is **integral windup**.",
        },
        {
          type: "text",
          md: "WPILib's `PIDController` ships with guardrails for exactly this. By default it limits the integral's contribution to the range `[-1.0, 1.0]` (an *integrator range*), and `setIZone(...)` can switch the integral off entirely whenever the error is larger than a chosen threshold — so the accumulator only does its job near the setpoint, where steady-state error lives, and never winds up during big moves. You'll build a clamp like this yourself in the Master section.",
        },
        {
          type: "quiz",
          question: "Your mechanism settles slightly short of the target and a pure-P controller never closes that last gap. Which term is designed to fix this steady-state error?",
          options: ["P", "I", "D", "It's unavoidable"],
          answerIndex: 1,
          explanation:
            "The integral accumulates the small lingering error over time until its contribution is enough to close the gap. (WPILib notes feedforward is usually the better fix in FRC, but the integral is the term built for steady-state error.)",
        },
      ],
    },

    // ── CONCEPT 5: system response ───────────────────────────────────────────
    {
      kind: "learn",
      title: "Reading the Response",
      minutes: 8,
      blurb: "Underdamped, overdamped, critically damped — the language of tuning.",
      blocks: [
        {
          type: "text",
          md: "When you command a step change — 'go from 0 to 90° now' — the way the mechanism gets there has a name, and WPILib groups the behavior into three responses:\n\n- **Underdamped** — it overshoots and *oscillates* around the target before settling. Usually too much P (or too much I).\n- **Overdamped** — it's *slow to rise* and never overshoots, creeping cautiously to the target. Usually too little P, or too much D.\n- **Critically damped** — the sweet spot: the *fastest possible rise without overshooting*. This is what tuning aims for.",
        },
        {
          type: "text",
          md: "These three words turn vague complaints into a tuning plan. 'The arm bounces at the top' means *underdamped* → lower P or add D. 'The arm takes forever to get there' means *overdamped* → raise P or reduce D. You're not guessing randomly; you're nudging the response from one named regime toward critically damped. Keep this vocabulary handy — every controller you tune for the rest of the curriculum is a search for critical damping.",
        },
        {
          type: "quiz",
          question: "Your elevator overshoots its setpoint and bounces up and down a few times before settling. Which response is this, and what's the typical fix?",
          options: [
            "Overdamped — raise kP",
            "Underdamped — lower kP and/or add kD",
            "Critically damped — no change needed",
            "Steady-state error — add kI",
          ],
          answerIndex: 1,
          explanation:
            "Overshoot-and-oscillate is an underdamped response. Lowering proportional gain and/or adding derivative damps it toward critically damped.",
        },
      ],
    },

    // ── CONCEPT 6: putting it together ───────────────────────────────────────
    {
      kind: "learn",
      title: "Putting It Together",
      minutes: 9,
      blurb: "The full equation, the tuning order, and the controller's practical knobs.",
      blocks: [
        {
          type: "text",
          md: "Stacked together, the three terms form the controller WPILib runs for you each loop:\n\n`u(t) = kP·e(t) + kI·∫e(t)dt + kD·(de/dt)`\n\nP scales with the *current* error, I with the *accumulated history* of error, and D with the *rate of change* of error. In code, `controller.calculate(measurement, setpoint)` evaluates all three each loop and returns the output. Understanding what's inside is what lets you tune deliberately instead of poking at numbers.",
        },
        {
          type: "callout",
          tone: "tip",
          md: "Tune in this order: bring **P** up until the mechanism reaches the target but slightly oscillates (underdamped) → add a little **D** to settle it toward critically damped → reach for **I** last and sparingly, only if a steady-state error remains. And always **clamp the output** to the legal motor range — WPILib uses `MathUtil.clamp(...)` — so the controller never commands beyond what the motor can deliver.",
        },
        {
          type: "text",
          md: "Two more practical knobs from WPILib's `PIDController` worth knowing now:\n\n- **`setTolerance(...)` + `atSetpoint()`** — declare 'close enough' (e.g. within 2°) and ask the controller whether it has arrived. This is how a 'turn to angle' command knows when to end.\n- **`enableContinuousInput(min, max)`** — for *circular* measurements like a turret or heading, where −179° and +179° are physically 2° apart. It tells the controller the input wraps around so it always turns the *short* way instead of spinning almost all the way around. (You met this idea in the Gyroscopes lesson.)\n\nOne caution: the controller assumes `calculate()` is called at a *consistent* interval (the default 20 ms). Call it irregularly and the I and D terms — which both depend on `dt` — misbehave.",
        },
        {
          type: "quiz",
          question: "You're tuning a brand-new mechanism from scratch. Which gain do you raise first, and why?",
          options: [
            "I, to remove steady-state error immediately",
            "D, to prevent any overshoot from the start",
            "P, to establish the basic response before adding damping or memory",
            "All three together, to save time",
          ],
          answerIndex: 2,
          explanation:
            "Start with P alone to get the core response (and find where it goes underdamped), then add D to damp toward critically damped, then I last and sparingly.",
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
          md: "Time to build something a real robot fires with. A **shooter** spins a flywheel up to a target RPM before launching a game piece. Velocity control is a textbook fit for **PI**: P reacts to the current speed error, and I supplies the *steady* output needed to hold RPM against friction once the error reaches zero — a pure-P controller would sag back the instant the error vanished, because (as you saw) its push disappears with the error.\n\nYour controller stores `kP`, `kI`, and a running `integral`, and exposes `calculate(targetRpm, measuredRpm)` to be called every loop. Watch the third test: at the target, P drops to zero but the integral *holds* the output. That's the whole reason velocity loops lean on I where position loops avoid it.",
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
          md: "Your shooter controller has the hidden flaw WPILib warned about: **integral windup**. While the flywheel is still spinning up (or if it jams), error persists and the integral keeps *accumulating* loop after loop. By the time the motor catches up, that ballooned integral drives a big overshoot as it 'unwinds.' This mirrors the integrator-range and IZone guardrails inside WPILib's `PIDController` — the simplest robust version is to **clamp the integrator** to a maximum magnitude so its stored energy can never run away.\n\nBuild a controller that caps its own integral within `[-maxIntegral, maxIntegral]` every loop. The tests push a large, persistent error and confirm the integral saturates instead of exploding.",
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
                "Integral windup — the integrator accumulated while error persisted; clamp the integrator (or use IZone / feedforward)",
                "Derivative gain is negative",
                "Setpoint too close to zero",
              ],
              answerIndex: 1,
              explanation:
                "While error persists (e.g. output saturated), the integral grows; when the system responds, the stored-up integral causes overshoot as it unwinds. Clamping the integrator, IZone, or preferring feedforward prevents it.",
            },
            {
              question:
                "A velocity controller holds the target perfectly but is slow to get there, lagging behind commanded speed (an overdamped response). Most direct fix?",
              options: [
                "Lower kI",
                "Raise kP so it pushes harder while error is large",
                "Remove the D term",
                "Lower the setpoint",
              ],
              answerIndex: 1,
              explanation:
                "A slow approach with a correct final value is overdamped — too little proportional authority. Raising kP increases the push during the large-error phase; the integral already handles steady state.",
            },
          ],
        },
      ],
    },
  ],
};
