import type { Track, Lesson } from "./types";

// ---------------------------------------------------------------------------
// Intermediate Track: sensors, closed-loop control, and autonomous.
// Assumes the Beginner track (command-based basics) is understood.
// ---------------------------------------------------------------------------

const encoders: Lesson = {
  id: "encoders",
  title: "Encoders",
  blurb: "Measure how far and how fast a mechanism has moved — through the full gear chain.",
  minutes: 14,
  blocks: [
    {
      type: "text",
      md: "An **encoder** reports rotation. Mounted on a motor or shaft, it counts ticks as things spin, letting your code answer two questions it was blind to before: *how far* has the mechanism moved, and *how fast* is it moving right now? This feedback is the foundation of every control loop you'll write.",
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
      md: "`setDistancePerPulse` is where the magic happens: it turns raw ticks into real-world units. Get this conversion right once and every distance you read is in meters. Get it wrong and every control loop downstream is off.",
    },
    {
      type: "text",
      md: "Encoders are **relative** by default — they read 0 wherever they powered on. Reset them at the start of an action so distances are measured from a known point:",
    },
    {
      type: "code",
      lang: "java",
      code: "encoder.reset();   // call in a command's initialize()",
    },
    {
      type: "quiz",
      question: "What does `setDistancePerPulse` accomplish?",
      options: [
        "It makes the encoder count faster",
        "It converts raw encoder ticks into real-world units like meters",
        "It resets the encoder to zero",
        "It inverts the encoder direction",
      ],
      answerIndex: 1,
      explanation:
        "Distance-per-pulse is the scale factor from ticks to physical units. Once set, `getDistance()` returns meters (or whatever unit you scaled to) instead of raw counts.",
    },
    {
      type: "coding",
      prompt:
        "Return the average distance of the two drivetrain encoders, `leftEncoder` and `rightEncoder`.",
      starter: "public double getAverageDistance() {\n    // return the average of the two encoder distances\n}",
      solution:
        "public double getAverageDistance() {\n    return (leftEncoder.getDistance() + rightEncoder.getDistance()) / 2.0;\n}",
      checks: [
        { label: "Reads the left encoder distance", pattern: "leftEncoder\\.getDistance\\(\\s*\\)" },
        { label: "Reads the right encoder distance", pattern: "rightEncoder\\.getDistance\\(\\s*\\)" },
        { label: "Returns their average (divides by 2)", pattern: "/\\s*2" },
      ],
      hint: "Add the two `getDistance()` calls and divide by 2.0, then `return` the result.",
    },
    {
      type: "text",
      md: "**Position is clean; velocity is noisy.** `getRate()` is computed by *differentiating* position (change in distance ÷ change in time), and differentiation amplifies the tiny quantization steps of the encoder into a jumpy signal. That's why a raw velocity reading flickers. Two fixes teams use: smooth it with a filter, or read velocity from the motor controller's onboard sensor, which measures it in hardware. Also know the difference between **relative** encoders (count from 0 at boot — need homing) and **absolute** encoders (always know their angle — great for arms).",
    },
    {
      type: "code",
      lang: "java",
      caption: "Ticks → real units depends on the full mechanical chain",
      code: "// motor encoder, geared down to a mechanism\ndouble motorRevs     = ticks / TICKS_PER_REV;\ndouble mechanismRevs = motorRevs / GEAR_RATIO;",
    },
    {
      type: "quiz",
      question: "Your `getRate()` velocity reading is jumpy and noisy. Why — and what helps most?",
      options: [
        "Encoders can't measure velocity; you must switch to a gyro",
        "Velocity is differentiated from position, which amplifies quantization noise; filtering (or the motor controller's hardware velocity) smooths it",
        "The robot is moving too slowly to register",
        "The noise means the encoder is broken and must be replaced",
      ],
      answerIndex: 1,
      explanation:
        "Velocity = Δposition / Δtime. Differentiation magnifies the encoder's small discrete steps into a noisy signal. A low-pass filter, or the velocity a smart motor controller measures onboard, gives a smoother reading.",
    },
    {
      type: "coding",
      prompt:
        "Convert raw counts to mechanism rotations. With `TICKS_PER_REV` counts per motor revolution and `GEAR_RATIO` motor revs per mechanism rev, write `mechanismRotations(double ticks)`.",
      starter: "public double mechanismRotations(double ticks) {\n    // ticks -> motor revolutions -> mechanism rotations\n}",
      solution: "public double mechanismRotations(double ticks) {\n    return (ticks / TICKS_PER_REV) / GEAR_RATIO;\n}",
      checks: [
        { label: "Divides ticks by TICKS_PER_REV", pattern: "ticks\\s*/\\s*TICKS_PER_REV" },
        { label: "Divides by the gear ratio", pattern: "/\\s*GEAR_RATIO" },
        { label: "Returns the result", pattern: "return\\s+" },
      ],
      hint: "`return (ticks / TICKS_PER_REV) / GEAR_RATIO;`",
    },
    {
      type: "text",
      md: "Put the whole chain together — this is the conversion every distance-based command and odometry depends on. Encoder ticks become motor revolutions (÷ ticks-per-rev), then mechanism revolutions (÷ gear ratio), then meters of wheel travel (× π × diameter). One wrong factor here and the robot drives the wrong distance with code that looks correct.",
    },
    {
      type: "coding",
      prompt:
        "Write the full conversion as a pure function: `double ticksToMeters(double ticks, double ticksPerRev, double gearRatio, double wheelDiameter)` = `(ticks / ticksPerRev / gearRatio) × (π × wheelDiameter)`.",
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
};

const gyro: Lesson = {
  id: "gyro",
  title: "Gyroscopes & Heading",
  blurb: "Know which way the robot is facing — and turn the short way every time.",
  minutes: 14,
  blocks: [
    {
      type: "text",
      md: "A **gyroscope** measures rotation about the vertical axis — the robot's **heading**. Modern FRC robots use a gyro (often built into a device like a Pigeon or navX) to drive straight, turn to precise angles, and enable field-oriented swerve driving.",
    },
    {
      type: "code",
      lang: "java",
      code: "AHRS gyro = new AHRS();   // navX example\n\ndouble heading = gyro.getAngle();   // degrees, accumulates\ngyro.reset();                       // zero the heading",
    },
    {
      type: "callout",
      tone: "warn",
      md: "Gyros **drift** slowly over a match as small errors accumulate. That's fine for short maneuvers, but for full-field position tracking you'll fuse the gyro with encoders using odometry (covered in the Advanced track).",
    },
    {
      type: "text",
      md: "The classic use: hold a heading while driving. Compare current heading to a target and feed the error into a controller to make corrective turns — exactly what you'll build with PID next.",
    },
    {
      type: "quiz",
      question: "Why shouldn't you rely on a gyro alone for full-field position tracking?",
      options: [
        "Gyros only work indoors",
        "Gyros drift over time as small errors accumulate",
        "Gyros can't measure angles",
        "Gyros only update once per match",
      ],
      answerIndex: 1,
      explanation:
        "Integration drift makes raw gyro heading unreliable over long periods. Sensor fusion (gyro + encoders via odometry) corrects for this.",
    },
    {
      type: "coding",
      prompt:
        "Write `headingError(double target)` that returns how far the robot's heading is from `target` (target minus the gyro's current angle).",
      starter: "public double headingError(double target) {\n    // return target minus the current heading\n}",
      solution: "public double headingError(double target) {\n    return target - gyro.getAngle();\n}",
      checks: [
        { label: "Reads gyro.getAngle()", pattern: "gyro\\.getAngle\\(\\s*\\)" },
        { label: "Subtracts heading from target", pattern: "target\\s*-\\s*gyro\\.getAngle" },
      ],
      hint: "`return target - gyro.getAngle();`",
    },
    {
      type: "text",
      md: "**Angles are circular, and that breaks naive subtraction.** If your target heading is 170° and the gyro reads -170°, a plain `target - heading` gives an error of 340° — so a heading controller would command the robot to spin almost all the way around instead of the easy 20° the other way. The fix is to **wrap** the error into [-180, 180) so the controller always takes the shortest path. WPILib's `PIDController.enableContinuousInput(-180, 180)` does this for you; understanding why is the point.",
    },
    {
      type: "callout",
      tone: "tip",
      md: "This is also why heading code uses `getRotation2d()` (a `Rotation2d`) instead of a raw degree count — `Rotation2d` math handles wraparound correctly, so 350° + 20° gives 10°, not 370°.",
    },
    {
      type: "quiz",
      question:
        "A heading controller targets 170° while the gyro reads -170°. Computed naively the error is 340°, so the robot spins the long way around. What's the right fix?",
      options: [
        "Use a faster, more expensive gyro",
        "Wrap the error into [-180, 180) so the controller takes the 20° short path instead of 340°",
        "Disable the gyro while turning",
        "Halve the error before feeding it to the controller",
      ],
      answerIndex: 1,
      explanation:
        "Heading is circular, so raw subtraction can yield an error magnitude greater than 180° that drives the long way around. Wrapping the error to [-180, 180) selects the shortest rotation — exactly what `enableContinuousInput` automates.",
    },
    {
      type: "coding",
      prompt:
        "Write `wrap(double deg)` that normalizes any angle into the range [-180, 180). A clean one-liner: `((deg + 180) % 360 + 360) % 360 - 180`.",
      starter: "public double wrap(double deg) {\n    // normalize the angle into [-180, 180)\n}",
      solution: "public double wrap(double deg) {\n    return ((deg + 180) % 360 + 360) % 360 - 180;\n}",
      checks: [
        { label: "Uses modulo 360", pattern: "%\\s*360" },
        { label: "Shifts by 180 to center the range", pattern: "(deg\\s*\\+\\s*180|-\\s*180)" },
        { label: "Returns the wrapped value", pattern: "return\\s+" },
      ],
      hint: "`return ((deg + 180) % 360 + 360) % 360 - 180;` — the double-modulo handles negative inputs.",
      tests: [
        { method: "wrap", args: [170.0], expected: 170.0, tolerance: 1e-9 },
        { method: "wrap", args: [-170.0], expected: -170.0, tolerance: 1e-9 },
        { method: "wrap", args: [190.0], expected: -170.0, tolerance: 1e-9 },
        { method: "wrap", args: [350.0], expected: -10.0, tolerance: 1e-9 },
        { method: "wrap", args: [540.0], expected: -180.0, tolerance: 1e-9 },
        { method: "wrap", args: [0.0], expected: 0.0 },
      ],
    },
    {
      type: "text",
      md: "Wrapping the *error* is what `enableContinuousInput` does internally, and it's worth seeing the shortest-path calculation on its own. Given a target and a measured heading, the shortest signed turn is `wrap(target − measured)` — a number in [-180, 180) telling the controller both how far and which way to rotate. This single helper is the difference between a turn-to-angle command that snaps efficiently and one that occasionally spins the long way around.",
    },
    {
      type: "coding",
      prompt:
        "Write `double shortestTurn(double target, double measured)` returning the shortest signed angular distance (degrees) from `measured` to `target`, wrapped into [-180, 180). Reuse the same `((x + 180) % 360 + 360) % 360 - 180` wrap on the difference.",
      starter:
        "public double shortestTurn(double target, double measured) {\n    double diff = target - measured;\n    // wrap diff into [-180, 180) and return it\n}",
      solution:
        "public double shortestTurn(double target, double measured) {\n    double diff = target - measured;\n    return ((diff + 180) % 360 + 360) % 360 - 180;\n}",
      checks: [
        { label: "Computes the raw difference", pattern: "diff\\s*=\\s*target\\s*-\\s*measured" },
        { label: "Wraps with modulo 360", pattern: "%\\s*360" },
        { label: "Returns the wrapped difference", pattern: "return\\s+" },
      ],
      hint: "`double diff = target - measured;` then `return ((diff + 180) % 360 + 360) % 360 - 180;`.",
      tests: [
        { method: "shortestTurn", args: [170.0, -170.0], expected: -20.0, tolerance: 1e-9 },
        { method: "shortestTurn", args: [-170.0, 170.0], expected: 20.0, tolerance: 1e-9 },
        { method: "shortestTurn", args: [90.0, 0.0], expected: 90.0, tolerance: 1e-9 },
        { method: "shortestTurn", args: [10.0, 350.0], expected: 20.0, tolerance: 1e-9 },
        { method: "shortestTurn", args: [0.0, 0.0], expected: 0.0 },
      ],
    },
  ],
};

const pidControl: Lesson = {
  id: "pid-control",
  title: "PID Control",
  blurb: "Drive a measured value to a target — and implement the controller math yourself.",
  minutes: 18,
  blocks: [
    {
      type: "text",
      md: "**PID** is the workhorse of robot control. Given a **setpoint** (where you want to be) and a **measurement** (where you are), a PID controller computes a motor output that shrinks the error to zero. The three terms:\n\n- **P** (proportional) — push harder the farther you are from the target\n- **I** (integral) — correct stubborn, lingering error over time\n- **D** (derivative) — damp the approach so you don't overshoot",
    },
    {
      type: "code",
      lang: "java",
      caption: "WPILib's PIDController does the math for you",
      code: "PIDController controller = new PIDController(0.1, 0.0, 0.02);\n\n// each loop: measure, compute, apply\ndouble output = controller.calculate(encoder.getDistance(), setpoint);\nmotor.set(output);",
    },
    {
      type: "callout",
      tone: "tip",
      md: "Start tuning with only **P**. Raise it until the mechanism reaches the target but oscillates slightly, then add a little **D** to settle it. Reach for **I** last, and sparingly — it's the most likely term to cause instability.",
    },
    {
      type: "text",
      md: "A controller knows it's done when the error is small enough. `atSetpoint()` reports that, using a tolerance you set:",
    },
    {
      type: "code",
      lang: "java",
      code: "controller.setTolerance(0.02);   // within 2 cm counts as \"there\"\nif (controller.atSetpoint()) {\n    motor.set(0);\n}",
    },
    {
      type: "quiz",
      question: "Which PID term is most responsible for reducing overshoot?",
      options: [
        "P — proportional",
        "I — integral",
        "D — derivative",
        "None; overshoot can't be controlled",
      ],
      answerIndex: 2,
      explanation:
        "The derivative term reacts to how fast the error is changing, damping the approach and reducing overshoot. P alone tends to overshoot; I can make it worse.",
    },
    {
      type: "coding",
      prompt:
        "Using the existing `controller`, compute the PID output toward `setpoint` from `encoder.getDistance()` and apply it to `motor`.",
      starter: "public void execute() {\n    // compute the PID output and apply it to the motor\n}",
      solution:
        "public void execute() {\n    double out = controller.calculate(encoder.getDistance(), setpoint);\n    motor.set(out);\n}",
      checks: [
        { label: "Calls controller.calculate(...)", pattern: "controller\\.calculate\\(" },
        { label: "Uses the encoder measurement", pattern: "encoder\\.getDistance\\(\\s*\\)" },
        { label: "Applies the output to the motor", pattern: "motor\\.set\\(" },
      ],
      hint: "Get `controller.calculate(measurement, setpoint)`, store it, then `motor.set(...)` it.",
    },
    {
      type: "text",
      md: "**The integral term is powerful and dangerous.** When error persists — say the mechanism is stalled or the output is already maxed out — the I term keeps *accumulating*. This is **integral windup**: the integrator builds a huge value, and once the robot finally catches up it dramatically overshoots while that accumulation 'unwinds.' Symptoms: big overshoot after a disturbance and a sluggish, sticky recovery. Mitigate it by clamping the output, limiting the integrator (an *integral zone* that only integrates near the setpoint), or just using less I.",
    },
    {
      type: "callout",
      tone: "tip",
      md: "Always **clamp the controller's output** to the legal motor range before applying it. PID math can return values well outside [-1, 1], and feeding those straight to a motor wastes the headroom feedforward needs and worsens windup.",
    },
    {
      type: "quiz",
      question:
        "After a large disturbance your mechanism overshoots badly and recovers slowly, and the integral term seems 'stuck' high. What's the most likely cause?",
      options: [
        "The proportional gain is too low",
        "Integral windup — the integrator accumulated a large value while error persisted; clamp the output or limit the integrator",
        "The derivative gain is negative",
        "The setpoint is too close to zero",
      ],
      answerIndex: 1,
      explanation:
        "While error persists (e.g., output saturated), the integral keeps growing. When the system finally responds, that stored-up integral causes overshoot as it unwinds. Output clamping, an integral zone, or a max-integrator limit prevent it.",
    },
    {
      type: "coding",
      prompt:
        "Compute the PID output and clamp it to [-1, 1] before applying. Use `controller.calculate(measurement, setpoint)`, then `Math.max(-1, Math.min(1, out))`, then `motor.set(out)`.",
      starter:
        "public void execute() {\n    double out = controller.calculate(measurement, setpoint);\n    // clamp out to [-1, 1], then apply it\n}",
      solution:
        "public void execute() {\n    double out = controller.calculate(measurement, setpoint);\n    out = Math.max(-1, Math.min(1, out));\n    motor.set(out);\n}",
      checks: [
        { label: "Clamps the upper bound with Math.min(1, ...)", pattern: "Math\\.min\\(\\s*1" },
        { label: "Clamps the lower bound with Math.max(-1, ...)", pattern: "Math\\.max\\(\\s*-\\s*1" },
        { label: "Applies the clamped output to the motor", pattern: "motor\\.set\\(" },
      ],
      hint: "`out = Math.max(-1, Math.min(1, out));` then `motor.set(out);`",
    },
    {
      type: "text",
      md: "Calling `controller.calculate()` is convenient, but you should understand what it computes — it's not magic. A discrete PID controller, once per loop, does exactly this:\n\n`error = setpoint − measurement`\n\n`derivative = (error − previousError) / dt`\n\n`output = kP·error + kI·(accumulated error) + kD·derivative`\n\nThe P term is proportional to *current* error, D to the *rate of change* of error (which is why it predicts and damps overshoot), and I to the *history* of error. Implementing even the PD core makes the tuning intuition concrete: P provides the restoring push, D fights the velocity that causes overshoot.",
    },
    {
      type: "coding",
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
      type: "text",
      md: "The **integral** term is fundamentally different from P and D: it has *memory*. Each loop it adds the current error to a running `integral` accumulator, so it grows as long as error persists — that's how it defeats steady-state error a pure-P controller can't. But that same memory is the source of **windup**: if error lingers (a stalled mechanism, a saturated output), the accumulator balloons and causes a big overshoot later when it 'unwinds'. You can only feel this by running the controller across *multiple* loops and watching the output keep climbing even when error is constant.",
    },
    {
      type: "coding",
      prompt:
        "Implement a PI controller that accumulates state across calls. The `Controller` class stores `kP`, `kI`, and a running `integral` (starts at 0). Complete `calculate(double error)` so it adds `error` to `integral`, then returns `kP*error + kI*integral`. The tests call it repeatedly on one instance — watch the integral build up.",
      starter:
        "public class Controller {\n    private double kP;\n    private double kI;\n    private double integral = 0;\n\n    public Controller(double kP, double kI) {\n        this.kP = kP;\n        this.kI = kI;\n    }\n\n    public double calculate(double error) {\n        // accumulate error into integral, then return kP*error + kI*integral\n    }\n}",
      solution:
        "public class Controller {\n    private double kP;\n    private double kI;\n    private double integral = 0;\n\n    public Controller(double kP, double kI) {\n        this.kP = kP;\n        this.kI = kI;\n    }\n\n    public double calculate(double error) {\n        integral += error;\n        return kP * error + kI * integral;\n    }\n}",
      checks: [
        { label: "Accumulates error into the integral", pattern: "integral\\s*\\+=\\s*error|integral\\s*=\\s*integral\\s*\\+\\s*error" },
        { label: "Returns kP*error + kI*integral", pattern: "kP\\s*\\*\\s*error\\s*\\+\\s*kI\\s*\\*\\s*integral" },
      ],
      hint: "Two lines: `integral += error;` then `return kP * error + kI * integral;`. Because `integral` is a field, it survives between calls — that's what makes the I term accumulate.",
      stateTests: [
        {
          className: "Controller",
          ctorArgs: [0.5, 0.1],
          label: "constant error 2.0",
          steps: [
            { method: "calculate", args: [2.0], expected: 1.2, tolerance: 1e-9 },
            { method: "calculate", args: [2.0], expected: 1.4, tolerance: 1e-9 },
            { method: "calculate", args: [2.0], expected: 1.6, tolerance: 1e-9 },
            { method: "calculate", args: [0.0], expected: 0.6, tolerance: 1e-9, label: "error gone, but integral persists (windup) → 0.6" },
          ],
        },
      ],
    },
  ],
};

const feedforward: Lesson = {
  id: "feedforward",
  title: "Feedforward",
  blurb: "Predict the effort a mechanism needs — and implement the kS/kV/kA model yourself.",
  minutes: 16,
  blocks: [
    {
      type: "text",
      md: "PID is **reactive** — it only acts once there's an error. **Feedforward** is **predictive**: it models the physics of your mechanism and supplies the voltage you *know* it'll need to hold or move. Pairing the two gives fast, accurate control: feedforward does the heavy lifting, PID cleans up the small remaining error.",
    },
    {
      type: "code",
      lang: "java",
      caption: "A simple motor feedforward (static, velocity, acceleration gains)",
      code: "SimpleMotorFeedforward ff = new SimpleMotorFeedforward(0.2, 2.5, 0.1);\n\n// voltage to hold a target velocity\ndouble volts = ff.calculate(targetVelocity);\nmotor.setVoltage(volts);",
    },
    {
      type: "callout",
      tone: "info",
      md: "For an arm fighting gravity you'd use `ArmFeedforward`, which adds a term for holding angle. The idea is the same: compute the effort physics demands, *then* let PID correct the difference.",
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
    {
      type: "coding",
      prompt:
        "Combine feedforward and PID: compute `ff.calculate(targetVel)` plus `pid.calculate(encoder.getRate(), targetVel)` and apply the sum with `motor.setVoltage(...)`.",
      starter: "public void execute() {\n    // combine feedforward + PID, then set voltage\n}",
      solution:
        "public void execute() {\n    double volts = ff.calculate(targetVel) + pid.calculate(encoder.getRate(), targetVel);\n    motor.setVoltage(volts);\n}",
      checks: [
        { label: "Calls ff.calculate(...)", pattern: "ff\\.calculate\\(" },
        { label: "Calls pid.calculate(...)", pattern: "pid\\.calculate\\(" },
        { label: "Sets motor voltage", pattern: "motor\\.setVoltage\\(" },
      ],
      hint: "Add the two calculate() results into one variable, then `motor.setVoltage(volts);`.",
    },
    {
      type: "text",
      md: "**Each feedforward gain models a specific physical effect**, and you measure them with a characterization tool (SysId) rather than guessing:\n\n- **kS** — static friction: the volts just to *start* moving, applied in the direction of motion\n- **kV** — the volts per unit of velocity (the dominant term at steady speed)\n- **kA** — the volts per unit of acceleration (matters during fast changes)\n\nAn arm adds **kG**, a gravity term, because holding it up takes voltage even at zero speed. Feedforward works in **volts**, which is why you pair it with `setVoltage()` — voltage control is consistent as the battery sags, unlike raw percent output.",
    },
    {
      type: "quiz",
      question:
        "In `SimpleMotorFeedforward(kS, kV, kA)`, which gain is the voltage needed just to overcome static friction and start the mechanism moving?",
      options: ["kV", "kS", "kA", "None — friction isn't modeled"],
      answerIndex: 1,
      explanation:
        "kS is the static gain: the voltage to break friction, applied in the direction of travel. kV scales with velocity, kA with acceleration.",
    },
    {
      type: "coding",
      prompt:
        "Implement a simple feedforward by hand. Write `volts(double vel)` returning `kS * Math.signum(vel) + kV * vel` — the static term (in the direction of motion) plus the velocity term.",
      starter:
        "public double volts(double vel) {\n    // kS overcomes friction in the direction of motion; kV scales with velocity\n}",
      solution: "public double volts(double vel) {\n    return kS * Math.signum(vel) + kV * vel;\n}",
      checks: [
        { label: "Static term uses Math.signum(vel)", pattern: "kS\\s*\\*\\s*Math\\.signum\\(\\s*vel\\s*\\)" },
        { label: "Velocity term is kV * vel", pattern: "kV\\s*\\*\\s*vel" },
        { label: "Returns the sum", pattern: "return\\s+" },
      ],
      hint: "`return kS * Math.signum(vel) + kV * vel;` — `Math.signum` gives the direction (+1 / -1).",
    },
    {
      type: "text",
      md: "The full `SimpleMotorFeedforward` adds the acceleration term, giving the complete model WPILib uses:\n\n`u = kS·sgn(v) + kV·v + kA·a`\n\nWhen you command a motion profile (next lessons), you feed it the *target* velocity and acceleration each loop and this returns the voltage physics predicts — before PID touches the small remainder. Note `sgn(v)` is `0` when `v` is `0`, so a stopped mechanism with no commanded acceleration gets `0` volts of feedforward (correct — nothing to overcome).",
    },
    {
      type: "coding",
      prompt:
        "Implement the full feedforward as a pure function of its gains and the commanded motion. Write `double feedforward(double kS, double kV, double kA, double velocity, double accel)` returning `kS*Math.signum(velocity) + kV*velocity + kA*accel`.",
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
};

const pathplanner: Lesson = {
  id: "pathplanner",
  title: "PathPlanner & Trajectories",
  blurb: "Make the robot follow a smooth, pre-planned route in autonomous.",
  minutes: 12,
  blocks: [
    {
      type: "text",
      md: "Autonomous routines need the robot to drive *somewhere specific*. A **trajectory** is a time-parameterized path — a sequence of positions, velocities, and headings the robot should hit. Tools like **PathPlanner** let you draw a path in a visual editor and generate the trajectory for you.",
    },
    {
      type: "code",
      lang: "java",
      caption: "Load a path and turn it into a follow command",
      code: "PathPlannerPath path = PathPlannerPath.fromPathFile(\"CenterAuto\");\n\nCommand follow = AutoBuilder.followPath(path);\nfollow.schedule();",
    },
    {
      type: "callout",
      tone: "info",
      md: "Under the hood, a path-following command feeds the trajectory's target states into your drivetrain's controllers every loop — combining the feedforward and PID ideas you just learned, applied to position and heading at once.",
    },
    {
      type: "text",
      md: "Because paths are just commands, they compose. A full autonomous routine chains path-follows with mechanism actions:",
    },
    {
      type: "code",
      lang: "java",
      code: "AutoBuilder.followPath(toScore)\n    .andThen(new ScoreGamePiece(arm))\n    .andThen(AutoBuilder.followPath(toPickup));",
    },
    {
      type: "quiz",
      question: "What is a trajectory?",
      options: [
        "A single target position",
        "A time-parameterized path of positions, velocities, and headings",
        "A type of motor controller",
        "The robot's battery voltage over time",
      ],
      answerIndex: 1,
      explanation:
        "A trajectory describes where the robot should be — and how fast, and facing where — at each moment in time, so a follower can track it smoothly.",
    },
    {
      type: "coding",
      prompt:
        "Build an auto command: follow `path`, then run a `new RaiseArm(arm)` afterward. Return the composed command.",
      starter: "public Command buildAuto() {\n    // follow the path, then raise the arm\n}",
      solution:
        "public Command buildAuto() {\n    return AutoBuilder.followPath(path).andThen(new RaiseArm(arm));\n}",
      checks: [
        { label: "Follows the path", pattern: "AutoBuilder\\.followPath\\(\\s*path\\s*\\)" },
        { label: "Chains with andThen", pattern: "\\.andThen\\(" },
        { label: "Raises the arm afterward", pattern: "new\\s+RaiseArm\\(" },
      ],
      hint: "`return AutoBuilder.followPath(path).andThen(new RaiseArm(arm));`",
    },
    {
      type: "text",
      md: "**A path is defined in field coordinates, so the robot must agree on where it is before following one.** At the start of autonomous you reset odometry to the path's starting pose — otherwise the follower thinks the robot is somewhere else and commands corrections toward the wrong place, sending it off-course immediately. Paths also support **event markers** and parallel actions: you often want a mechanism running *while* driving, finishing exactly when the path does.",
    },
    {
      type: "code",
      lang: "java",
      caption: "Reset pose, then follow",
      code: "public void autonomousInit() {\n    drivetrain.resetOdometry(path.getStartingHolonomicPose().get());\n    AutoBuilder.followPath(path).schedule();\n}",
    },
    {
      type: "quiz",
      question: "Why reset odometry to the path's starting pose before running a PathPlanner auto?",
      options: [
        "It recharges the battery between matches",
        "So the follower's estimate of where the robot is matches where the path expects to begin — otherwise it corrects toward the wrong position",
        "To reset the gyro to point straight up",
        "It's optional and changes nothing",
      ],
      answerIndex: 1,
      explanation:
        "Paths live in field coordinates. If the pose estimator disagrees with the path's start, the follower immediately drives to fix a phantom error. Resetting pose to the path start makes them agree.",
    },
    {
      type: "coding",
      prompt:
        "Run the intake *only while* following the path — it should stop the instant the path finishes. Use `.deadlineWith(...)`: `AutoBuilder.followPath(path).deadlineWith(new RunIntake(intake))`.",
      starter: "public Command pickupWhileDriving() {\n    // follow the path; run intake only until the path ends\n}",
      solution:
        "public Command pickupWhileDriving() {\n    return AutoBuilder.followPath(path).deadlineWith(new RunIntake(intake));\n}",
      checks: [
        { label: "Follows the path", pattern: "AutoBuilder\\.followPath\\(\\s*path\\s*\\)" },
        { label: "Uses deadlineWith so the path sets the duration", pattern: "\\.deadlineWith\\(" },
        { label: "Runs the intake alongside", pattern: "new\\s+RunIntake\\(" },
      ],
      hint: "`return AutoBuilder.followPath(path).deadlineWith(new RunIntake(intake));` — the deadline (the path) decides when the group ends.",
    },
  ],
};

const visionBasics: Lesson = {
  id: "vision-basics",
  title: "Vision & AprilTags",
  blurb: "Let the robot see targets and locate itself on the field.",
  minutes: 12,
  blocks: [
    {
      type: "text",
      md: "A vision system (Limelight, PhotonVision) runs a camera + processor that detects targets — most importantly **AprilTags**, the fiducial markers placed around the field. From a detected tag the robot learns the angle to the target and, because each tag's field location is known, can estimate where *it* is.",
    },
    {
      type: "code",
      lang: "java",
      caption: "Read a target's horizontal offset (PhotonVision)",
      code: "var result = camera.getLatestResult();\nif (result.hasTargets()) {\n    double yaw = result.getBestTarget().getYaw();   // degrees off-center\n    drivetrain.arcade(0, -0.02 * yaw);              // turn to face it\n}",
    },
    {
      type: "callout",
      tone: "tip",
      md: "Always guard vision reads with `hasTargets()`. Cameras lose sight of tags constantly — at the edge of frame, under motion blur, behind another robot. Code that assumes a target is always visible will throw or jerk the robot.",
    },
    {
      type: "quiz",
      question: "What must you check before using a vision target's data?",
      options: [
        "The battery voltage",
        "That the camera actually has a target in view (hasTargets())",
        "The gyro heading",
        "Nothing — target data is always valid",
      ],
      answerIndex: 1,
      explanation:
        "Vision is intermittent. Guard every read with `hasTargets()` (or equivalent) so you never act on stale or missing data.",
    },
    {
      type: "coding",
      prompt:
        "Only when the camera `result` has targets, turn toward the best target's yaw: call `drivetrain.arcade(0, -0.02 * yaw)`.",
      starter:
        "public void execute() {\n    var result = camera.getLatestResult();\n    // if there is a target, turn toward it\n}",
      solution:
        "public void execute() {\n    var result = camera.getLatestResult();\n    if (result.hasTargets()) {\n        double yaw = result.getBestTarget().getYaw();\n        drivetrain.arcade(0, -0.02 * yaw);\n    }\n}",
      checks: [
        { label: "Guards with hasTargets()", pattern: "result\\.hasTargets\\(\\s*\\)" },
        { label: "Reads the best target's yaw", pattern: "getBestTarget\\(\\s*\\)\\.getYaw\\(" },
        { label: "Turns the drivetrain", pattern: "drivetrain\\.arcade\\(" },
      ],
      hint: "Wrap the turn in `if (result.hasTargets()) { ... }` and read `getBestTarget().getYaw()`.",
    },
    {
      type: "text",
      md: "**Vision lies sometimes, and good code expects it.** A single AprilTag can be *ambiguous* (two poses fit the same image), a misidentified tag can report a pose meters away, and every measurement arrives a little **late** (the frame was captured tens of milliseconds ago). Robust pose fusion: timestamp every measurement so the estimator can rewind, prefer **multi-tag** solutions, trust vision *less* as the tag gets farther, and **reject** measurements that jump implausibly far from the current estimate.",
    },
    {
      type: "callout",
      tone: "warn",
      md: "Never feed a wild vision pose straight into your estimator — one bad frame can teleport your robot's believed position across the field mid-auto. A simple sanity gate (reject jumps beyond a meter or two) prevents the worst failures.",
    },
    {
      type: "quiz",
      question:
        "Vision occasionally reports a pose several meters off because a tag was misidentified. How should robust code handle this?",
      options: [
        "Always trust the newest vision pose — it's the most recent data",
        "Reject measurements that jump implausibly far from the current estimate, and weight vision by distance/ambiguity",
        "Turn off odometry whenever a tag is visible",
        "Average the last 100 raw camera frames before using any",
      ],
      answerIndex: 1,
      explanation:
        "Outlier rejection plus distance/ambiguity-based trust keeps one bad frame from corrupting the estimate. Blindly trusting the newest pose lets a single misread tag teleport the robot.",
    },
    {
      type: "coding",
      prompt:
        "Gate bad measurements: only add the vision pose if it's within 1 meter of the `current` estimate. Use `current.getTranslation().getDistance(visionPose.getTranslation()) < 1.0`, then `estimator.addVisionMeasurement(visionPose, Timer.getFPGATimestamp())`.",
      starter:
        "public void addIfPlausible(Pose2d visionPose, Pose2d current) {\n    // accept only measurements within 1 meter of the current estimate\n}",
      solution:
        "public void addIfPlausible(Pose2d visionPose, Pose2d current) {\n    if (current.getTranslation().getDistance(visionPose.getTranslation()) < 1.0) {\n        estimator.addVisionMeasurement(visionPose, Timer.getFPGATimestamp());\n    }\n}",
      checks: [
        { label: "Computes the distance between the poses", pattern: "getTranslation\\(\\s*\\)\\.getDistance\\(" },
        { label: "Compares against 1.0 meter", pattern: "<\\s*1\\.0" },
        { label: "Adds the vision measurement when plausible", pattern: "addVisionMeasurement\\(" },
      ],
      hint: "Wrap the add in `if (current.getTranslation().getDistance(visionPose.getTranslation()) < 1.0) { ... }`.",
    },
  ],
};

const stateMachines: Lesson = {
  id: "state-machines",
  title: "State Machines",
  blurb: "Coordinate complex multi-step mechanisms reliably.",
  minutes: 12,
  blocks: [
    {
      type: "text",
      md: "When a mechanism has distinct **modes** — an intake that is *idle*, *intaking*, *holding*, or *ejecting* — a **state machine** keeps the logic clean. You name the states, define what happens in each, and define the transitions between them. No more tangled webs of boolean flags.",
    },
    {
      type: "code",
      lang: "java",
      caption: "An enum-driven state machine in a subsystem",
      code: "enum State { IDLE, INTAKING, HOLDING, EJECTING }\nprivate State state = State.IDLE;\n\npublic void periodic() {\n    switch (state) {\n        case INTAKING -> {\n            motor.set(0.7);\n            if (hasGamePiece()) state = State.HOLDING;\n        }\n        case HOLDING -> motor.set(0.05);\n        case EJECTING -> motor.set(-0.7);\n        case IDLE -> motor.set(0);\n    }\n}",
    },
    {
      type: "callout",
      tone: "tip",
      md: "The big win is **predictability**: the mechanism is always in exactly one known state, and transitions are explicit. When debugging, you can log the current state and immediately understand what the robot is trying to do.",
    },
    {
      type: "quiz",
      question: "What is the main benefit of a state machine over scattered boolean flags?",
      options: [
        "It uses fewer motors",
        "The mechanism is always in exactly one known state with explicit transitions",
        "It runs faster",
        "It removes the need for sensors",
      ],
      answerIndex: 1,
      explanation:
        "A state machine guarantees one well-defined state at a time and makes every transition explicit — far easier to reason about and debug than interacting boolean flags.",
    },
    {
      type: "coding",
      prompt:
        "Add a method `eject()` that puts the machine into the `EJECTING` state by setting the `state` field.",
      starter: "public void eject() {\n    // set the state to EJECTING\n}",
      solution: "public void eject() {\n    state = State.EJECTING;\n}",
      checks: [
        { label: "Sets state to State.EJECTING", pattern: "state\\s*=\\s*State\\.EJECTING" },
      ],
      hint: "`state = State.EJECTING;`",
    },
    {
      type: "text",
      md: "**Not every transition should be allowed.** A robust state machine *guards* its transitions so the mechanism can only move between *valid* states — you don't want to start intaking while mid-eject, or shoot before the flywheel is up to speed. Guarding requests (and ignoring invalid ones) keeps the machine in a known-good state at all times, which is exactly what makes it more reliable than a pile of booleans. Bonus: log the current state every loop so a match replay shows precisely what the mechanism was doing.",
    },
    {
      type: "quiz",
      question:
        "Why guard a transition with `if (state == IDLE)` instead of always allowing it?",
      options: [
        "It makes the code shorter",
        "Guards block illegal transitions (e.g. starting intake while ejecting), keeping the machine in only valid states",
        "Guards make the motor spin faster",
        "Java requires a condition before any field assignment",
      ],
      answerIndex: 1,
      explanation:
        "Without guards, any event could throw the machine into an inconsistent state. Allowing a transition only from valid predecessor states is what makes the state machine trustworthy.",
    },
    {
      type: "coding",
      prompt:
        "Add a guarded transition `requestIntake()` that moves the machine to `INTAKING` **only if** it is currently `IDLE`; otherwise it does nothing.",
      starter: "public void requestIntake() {\n    // only start intaking from the IDLE state\n}",
      solution:
        "public void requestIntake() {\n    if (state == State.IDLE) {\n        state = State.INTAKING;\n    }\n}",
      checks: [
        { label: "Guards on the current state being IDLE", pattern: "state\\s*==\\s*State\\.IDLE" },
        { label: "Transitions to INTAKING", pattern: "state\\s*=\\s*State\\.INTAKING" },
      ],
      hint: "`if (state == State.IDLE) { state = State.INTAKING; }`",
    },
  ],
};

export const intermediateTrack: Track = {
  id: "intermediate",
  title: "Intermediate: Sensors, Control & Autonomous",
  level: "Intermediate",
  blurb:
    "Add feedback and control to your robot — encoders, gyros, PID, vision, path following, and state machines.",
  modules: [
    {
      id: "sensors-feedback",
      title: "Sensors & Feedback",
      blurb: "Give the robot a sense of how far it's moved and where it faces.",
      lessons: [encoders, gyro],
    },
    {
      id: "closed-loop",
      title: "Closed-Loop Control",
      blurb: "Drive measured values to targets with PID and feedforward.",
      lessons: [pidControl, feedforward],
    },
    {
      id: "autonomous",
      title: "Autonomous & Coordination",
      blurb: "Path following, vision, and structured multi-step logic.",
      lessons: [pathplanner, visionBasics, stateMachines],
    },
  ],
};
