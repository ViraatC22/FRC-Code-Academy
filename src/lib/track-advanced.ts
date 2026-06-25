import type { Track, Lesson } from "./types";

// ---------------------------------------------------------------------------
// Advanced Track: estimation, tooling, and architecture for championship code.
// Assumes the Intermediate track (sensors + control) is understood.
// ---------------------------------------------------------------------------

const odometry: Lesson = {
  id: "odometry",
  title: "Odometry",
  blurb: "Track the robot's position on the field as it drives.",
  minutes: 13,
  blocks: [
    {
      type: "text",
      md: "**Odometry** fuses your wheel encoders and gyro to continuously estimate the robot's **pose** — its (x, y) position and heading on the field. Every loop you feed it the latest sensor readings and it integrates them into an updated position. This is what makes 'drive to a field location' possible.",
    },
    {
      type: "code",
      lang: "java",
      caption: "Differential-drive odometry",
      code: "DifferentialDriveOdometry odometry =\n    new DifferentialDriveOdometry(gyro.getRotation2d(), 0, 0);\n\npublic void periodic() {\n    odometry.update(\n        gyro.getRotation2d(),\n        leftEncoder.getDistance(),\n        rightEncoder.getDistance());\n}\n\nPose2d pose = odometry.getPoseMeters();",
    },
    {
      type: "callout",
      tone: "warn",
      md: "Odometry is **dead reckoning** — it accumulates error from wheel slip and gyro drift. Over a full match the estimate wanders. The fix is to blend in absolute vision measurements, which pose estimation does next.",
    },
    {
      type: "quiz",
      question: "What does odometry compute?",
      options: [
        "The battery's remaining charge",
        "The robot's (x, y) position and heading on the field",
        "The motor temperatures",
        "The optimal PID gains",
      ],
      answerIndex: 1,
      explanation:
        "Odometry integrates encoder and gyro data each loop into a continuously updated field pose (x, y, heading).",
    },
    {
      type: "coding",
      prompt:
        "Inside `periodic()`, update the `odometry` with the current `gyro.getRotation2d()` and both encoder distances (`leftEncoder`, `rightEncoder`).",
      starter: "public void periodic() {\n    // update odometry with gyro + both encoder distances\n}",
      solution:
        "public void periodic() {\n    odometry.update(gyro.getRotation2d(), leftEncoder.getDistance(), rightEncoder.getDistance());\n}",
      checks: [
        { label: "Calls odometry.update(...)", pattern: "odometry\\.update\\(" },
        { label: "Passes the gyro rotation", pattern: "gyro\\.getRotation2d\\(\\s*\\)" },
        { label: "Passes the left encoder distance", pattern: "leftEncoder\\.getDistance\\(\\s*\\)" },
        { label: "Passes the right encoder distance", pattern: "rightEncoder\\.getDistance\\(\\s*\\)" },
      ],
      hint: "`odometry.update(gyro.getRotation2d(), leftEncoder.getDistance(), rightEncoder.getDistance());`",
    },
    {
      type: "text",
      md: "**Heading comes from the gyro, not the wheels — on purpose.** You *could* infer heading from the difference between left and right encoder distances, but wheel scrub and slip during turns make that estimate drift quickly. The gyro measures rotation directly and far more accurately, so good odometry fuses **gyro heading** with **encoder distance**. Everything lives in the field coordinate frame, which is why you must reset the pose to a known starting point before autonomous — otherwise your whole map is offset.",
    },
    {
      type: "callout",
      tone: "info",
      md: "Swerve odometry is the same idea but richer: it combines each module's angle and drive distance into a chassis movement every loop. The math (a 'twist') accounts for the curved path the robot actually takes between samples, not just a straight line.",
    },
    {
      type: "quiz",
      question:
        "On a differential drive, why feed *gyro* heading into odometry instead of computing heading from the left/right encoder difference?",
      options: [
        "The gyro is cheaper than encoders",
        "Wheel scrub and slip make encoder-derived heading drift badly; the gyro measures rotation directly and far more accurately",
        "Encoders can't be sampled fast enough for heading",
        "Odometry doesn't actually need heading",
      ],
      answerIndex: 1,
      explanation:
        "Encoder-difference heading accumulates error from slip and scrub, especially during turns. The gyro senses angular rotation directly, so fusing gyro heading with encoder distance gives a far more stable pose.",
    },
    {
      type: "coding",
      prompt:
        "Write `resetTo(Pose2d start)` that re-seeds odometry at a known pose: call `odometry.resetPosition(gyro.getRotation2d(), leftEncoder.getDistance(), rightEncoder.getDistance(), start)`.",
      starter: "public void resetTo(Pose2d start) {\n    // re-seed odometry at the given starting pose\n}",
      solution:
        "public void resetTo(Pose2d start) {\n    odometry.resetPosition(gyro.getRotation2d(), leftEncoder.getDistance(), rightEncoder.getDistance(), start);\n}",
      checks: [
        { label: "Calls odometry.resetPosition(...)", pattern: "odometry\\.resetPosition\\(" },
        { label: "Passes the gyro rotation", pattern: "gyro\\.getRotation2d\\(\\s*\\)" },
        { label: "Passes the starting pose", pattern: "start" },
      ],
      hint: "`odometry.resetPosition(gyro.getRotation2d(), leftEncoder.getDistance(), rightEncoder.getDistance(), start);`",
    },
  ],
};

const poseEstimation: Lesson = {
  id: "pose-estimation",
  title: "Pose Estimation",
  blurb: "Fuse odometry with vision for a position you can trust.",
  minutes: 13,
  blocks: [
    {
      type: "text",
      md: "A **pose estimator** is odometry that also accepts **vision measurements**. It trusts encoders/gyro for smooth, high-rate updates, then nudges the estimate toward absolute AprilTag-based positions when vision sees a tag. The result corrects drift without the jitter of using vision alone.",
    },
    {
      type: "code",
      lang: "java",
      caption: "Feed both wheel odometry and vision into the estimator",
      code: "DifferentialDrivePoseEstimator estimator = /* ... */;\n\npublic void periodic() {\n    estimator.update(gyro.getRotation2d(),\n                     leftEncoder.getDistance(),\n                     rightEncoder.getDistance());\n\n    if (camera.hasTarget()) {\n        estimator.addVisionMeasurement(camera.getEstimatedPose(),\n                                       camera.getTimestamp());\n    }\n}",
    },
    {
      type: "callout",
      tone: "info",
      md: "The estimator weights each source by its **trust** (standard deviations). Vision measurements arrive with a timestamp so the estimator can correctly blend a slightly-old camera reading into the current estimate — handling latency properly.",
    },
    {
      type: "quiz",
      question: "How does a pose estimator improve on plain odometry?",
      options: [
        "It removes the need for encoders",
        "It corrects accumulated drift by fusing in absolute vision measurements",
        "It runs the motors faster",
        "It only uses vision, ignoring encoders",
      ],
      answerIndex: 1,
      explanation:
        "It keeps odometry's smooth high-rate updates but periodically corrects the drift with absolute, AprilTag-based vision poses — weighting each by trust.",
    },
    {
      type: "coding",
      prompt:
        "When `camera.hasTarget()` is true, add a vision measurement: pass `camera.getEstimatedPose()` and `camera.getTimestamp()` to `estimator.addVisionMeasurement(...)`.",
      starter:
        "public void addVision() {\n    // only when a target is visible, add the vision measurement\n}",
      solution:
        "public void addVision() {\n    if (camera.hasTarget()) {\n        estimator.addVisionMeasurement(camera.getEstimatedPose(), camera.getTimestamp());\n    }\n}",
      checks: [
        { label: "Guards with camera.hasTarget()", pattern: "camera\\.hasTarget\\(\\s*\\)" },
        { label: "Adds a vision measurement", pattern: "estimator\\.addVisionMeasurement\\(" },
        { label: "Includes the timestamp", pattern: "camera\\.getTimestamp\\(\\s*\\)" },
      ],
      hint: "Wrap the `addVisionMeasurement(pose, timestamp)` call in `if (camera.hasTarget()) { ... }`.",
    },
    {
      type: "text",
      md: "**The estimator blends sources by *trust*, expressed as standard deviations** — and you control them. Bigger standard deviations mean 'this source is noisier, trust it less,' so the estimate moves toward it more gently. Smart teams scale vision trust with distance: a tag 1 m away is reliable (small std dev), one 6 m away across the field is shaky (large std dev). Combined with timestamps for latency, this is what lets vision correct drift without making the robot's believed position twitch every frame.",
    },
    {
      type: "code",
      lang: "java",
      caption: "Tell the estimator how much to trust this measurement",
      code: "// [x meters, y meters, heading radians] — larger = less trust\nestimator.addVisionMeasurement(\n    visionPose, timestamp,\n    VecBuilder.fill(0.5, 0.5, 0.9));",
    },
    {
      type: "quiz",
      question:
        "You want the estimator to trust a vision measurement *less* when the tag is far away. Which concept expresses that 'trust'?",
      options: [
        "Passing a larger pose to addVisionMeasurement",
        "The measurement's standard deviations — larger std devs mean less trust, so the estimate moves toward it less",
        "Calling resetPosition every loop",
        "Increasing the odometry update rate",
      ],
      answerIndex: 1,
      explanation:
        "The estimator is a Kalman filter; it weights each source by its standard deviation. Larger vision std devs = less trust. Scaling them up with measured distance lets far, shaky tags nudge the estimate only slightly.",
    },
    {
      type: "coding",
      prompt:
        "Trust vision less as it gets farther away. Write `visionStdDevForDistance(double meters)` returning a base of `0.1` plus `0.2` per meter — i.e. `0.1 + 0.2 * meters`.",
      starter:
        "public double visionStdDevForDistance(double meters) {\n    // larger result = less trust; grow it with distance\n}",
      solution: "public double visionStdDevForDistance(double meters) {\n    return 0.1 + 0.2 * meters;\n}",
      checks: [
        { label: "Includes the base trust of 0.1", pattern: "0\\.1" },
        { label: "Grows by 0.2 per meter", pattern: "0\\.2\\s*\\*\\s*meters" },
        { label: "Returns the result", pattern: "return\\s+" },
      ],
      hint: "`return 0.1 + 0.2 * meters;`",
    },
  ],
};

const kalman: Lesson = {
  id: "kalman",
  title: "Kalman Filters",
  blurb: "The math that powers trustworthy state estimation.",
  minutes: 11,
  blocks: [
    {
      type: "text",
      md: "A **Kalman filter** is the principled way to combine a noisy prediction with a noisy measurement into an estimate better than either. It tracks not just the state but the **uncertainty** of that state, and weights new information by how much it trusts it. WPILib's pose estimators are Kalman filters under the hood — you rarely implement one by hand, but understanding it explains *why* tuning works the way it does.",
    },
    {
      type: "callout",
      tone: "info",
      md: "The tuning knobs are **standard deviations**: how noisy you believe your model (process) is, versus your measurements. Tell the filter vision is noisy and it leans on odometry; tell it encoders slip and it leans on vision. You're really tuning *trust*.",
    },
    {
      type: "text",
      md: "Conceptually each cycle does two steps:\n\n- **Predict** — advance the state using the model, growing uncertainty\n- **Correct** — pull the estimate toward a new measurement, shrinking uncertainty in proportion to how much you trust it",
    },
    {
      type: "quiz",
      question: "What does a Kalman filter track in addition to the state itself?",
      options: [
        "The battery voltage",
        "The uncertainty (covariance) of the estimate",
        "The match time remaining",
        "The motor temperature",
      ],
      answerIndex: 1,
      explanation:
        "By tracking uncertainty alongside the state, the filter can optimally weight predictions against measurements — the heart of sensor fusion.",
    },
    {
      type: "coding",
      prompt:
        "Conceptually, larger measurement standard deviations mean *less* trust in that sensor. Write a method `trustVisionLess()` that sets `visionStdDev = 2.0` (higher = less trust).",
      starter: "public void trustVisionLess() {\n    // raise the vision standard deviation to 2.0\n}",
      solution: "public void trustVisionLess() {\n    visionStdDev = 2.0;\n}",
      checks: [
        { label: "Sets visionStdDev to 2.0", pattern: "visionStdDev\\s*=\\s*2(\\.0)?" },
      ],
      hint: "`visionStdDev = 2.0;`",
    },
    {
      type: "text",
      md: "**The two-step cycle is the whole idea.** In **predict**, the filter advances the state with its model and *grows* the uncertainty — the model is imperfect and time has passed, so it's less sure than before. In **correct**, a measurement arrives and the filter pulls the estimate toward it, *shrinking* uncertainty. How far it pulls is the **Kalman gain**: a trust ratio between how uncertain the prediction is and how noisy the measurement is. High measurement noise → small gain → barely move; confident measurement → large gain → snap toward it.",
    },
    {
      type: "callout",
      tone: "info",
      md: "A **complementary filter** is the simple cousin you can write by hand: `estimate = α·model + (1-α)·measurement`. It's a fixed-trust blend instead of a dynamically computed gain — good intuition for what the Kalman filter does automatically.",
    },
    {
      type: "quiz",
      question:
        "During a Kalman filter's *predict* step (before any new measurement), what happens to the estimate's uncertainty?",
      options: [
        "It shrinks, because predicting adds information",
        "It grows, because the model is imperfect and time has elapsed",
        "It stays exactly the same",
        "It immediately drops to zero",
      ],
      answerIndex: 1,
      explanation:
        "Predict advances the state through an imperfect model, so confidence decreases (uncertainty grows). The correct step then incorporates a measurement and shrinks uncertainty again.",
    },
    {
      type: "coding",
      prompt:
        "Write a complementary filter: `blend(double model, double measurement, double alpha)` returning `alpha * model + (1 - alpha) * measurement` (alpha weights the model, the rest weights the measurement).",
      starter:
        "public double blend(double model, double measurement, double alpha) {\n    // weight model by alpha, measurement by (1 - alpha)\n}",
      solution:
        "public double blend(double model, double measurement, double alpha) {\n    return alpha * model + (1 - alpha) * measurement;\n}",
      checks: [
        { label: "Weights the model by alpha", pattern: "alpha\\s*\\*\\s*model" },
        { label: "Weights the measurement by (1 - alpha)", pattern: "\\(\\s*1\\s*-\\s*alpha\\s*\\)\\s*\\*\\s*measurement" },
        { label: "Returns the blend", pattern: "return\\s+" },
      ],
      hint: "`return alpha * model + (1 - alpha) * measurement;`",
    },
  ],
};

const advantagekit: Lesson = {
  id: "advantagekit",
  title: "Logging with AdvantageKit",
  blurb: "Record everything so you can debug matches after the fact.",
  minutes: 12,
  blocks: [
    {
      type: "text",
      md: "Top teams **log relentlessly**. Tools like **AdvantageKit** record every input, sensor reading, and output to a file each loop. When something goes wrong in a match you can replay the log and see *exactly* what the robot saw and did — no guessing, no trying to reproduce it in the pit.",
    },
    {
      type: "code",
      lang: "java",
      caption: "Logging values for later analysis",
      code: "Logger.recordOutput(\"Drivetrain/Pose\", estimator.getEstimatedPose());\nLogger.recordOutput(\"Arm/SetpointDeg\", armSetpoint);\nLogger.recordOutput(\"Intake/HasPiece\", hasGamePiece());",
    },
    {
      type: "callout",
      tone: "tip",
      md: "AdvantageKit's superpower is **deterministic replay**: because all inputs are logged, you can re-run your exact robot code against a recorded match and even test code changes against real data — like a flight recorder you can fast-forward.",
    },
    {
      type: "quiz",
      question: "What is the main benefit of comprehensive logging?",
      options: [
        "It makes the robot drive faster",
        "You can replay exactly what happened to debug issues after a match",
        "It charges the battery",
        "It replaces the need for sensors",
      ],
      answerIndex: 1,
      explanation:
        "Detailed logs let you reconstruct precisely what the robot sensed and commanded, turning 'it did something weird' into a concrete, replayable investigation.",
    },
    {
      type: "coding",
      prompt:
        "Log the arm angle: call `Logger.recordOutput` with the key `\"Arm/AngleDeg\"` and the value `encoder.getDistance()`.",
      starter: "public void log() {\n    // record the arm angle under \"Arm/AngleDeg\"\n}",
      solution: "public void log() {\n    Logger.recordOutput(\"Arm/AngleDeg\", encoder.getDistance());\n}",
      checks: [
        { label: "Calls Logger.recordOutput(...)", pattern: "Logger\\.recordOutput\\(" },
        { label: "Uses the key \"Arm/AngleDeg\"", pattern: "\"Arm/AngleDeg\"" },
        { label: "Logs the encoder value", pattern: "encoder\\.getDistance\\(\\s*\\)" },
      ],
      hint: "`Logger.recordOutput(\"Arm/AngleDeg\", encoder.getDistance());`",
    },
    {
      type: "text",
      md: "**Deterministic replay is the feature that changes how you debug.** AdvantageKit splits each subsystem into an **IO layer** (everything that reads hardware) and your logic. If *every input* — sensor values, joystick, timestamps — is logged, you can later feed those exact inputs back through the *same code* and reproduce the run bit-for-bit. A bug that happened once in a match becomes something you can replay on your laptop, add logging to, and even fix against the real data. That only works because the inputs were captured; logging just the outputs isn't enough.",
    },
    {
      type: "callout",
      tone: "tip",
      md: "View logs in **AdvantageScope**: plot the pose on a field, scrub time, and overlay setpoints against measurements. Namespacing keys like `\"Drive/Pose\"` and `\"Intake/HasPiece\"` keeps the data organized and graphable.",
    },
    {
      type: "quiz",
      question:
        "AdvantageKit can replay your exact code against a recorded match. What makes that deterministic replay possible?",
      options: [
        "Logging only the battery voltage each loop",
        "Logging every *input* (sensor readings, joystick, timestamps) so re-running the same code reproduces the same outputs",
        "Running the match twice on the real robot",
        "Disabling subsystems while logging",
      ],
      answerIndex: 1,
      explanation:
        "Replay reproduces a run only if all inputs to your logic were captured. Feeding those logged inputs back through identical code yields identical outputs — letting you debug after the fact.",
    },
    {
      type: "coding",
      prompt:
        "Log two values for AdvantageScope: the drive pose under `\"Drive/Pose\"` (use `estimator.getEstimatedPose()`) and whether a piece is held under `\"Intake/HasPiece\"` (use `hasGamePiece()`).",
      starter: "public void log() {\n    // record the drive pose and the intake state\n}",
      solution:
        "public void log() {\n    Logger.recordOutput(\"Drive/Pose\", estimator.getEstimatedPose());\n    Logger.recordOutput(\"Intake/HasPiece\", hasGamePiece());\n}",
      checks: [
        { label: "Logs the pose under \"Drive/Pose\"", pattern: "recordOutput\\(\\s*\"Drive/Pose\"" },
        { label: "Reads the estimated pose", pattern: "estimator\\.getEstimatedPose\\(\\s*\\)" },
        { label: "Logs the intake state under \"Intake/HasPiece\"", pattern: "recordOutput\\(\\s*\"Intake/HasPiece\"" },
      ],
      hint: "Two `Logger.recordOutput(key, value)` calls — pose first, then `hasGamePiece()`.",
    },
  ],
};

const simulation: Lesson = {
  id: "simulation",
  title: "Simulation",
  blurb: "Test robot code without a robot.",
  minutes: 12,
  blocks: [
    {
      type: "text",
      md: "WPILib can **simulate** your robot: physics models stand in for real motors and sensors so you can run your full code on a laptop. You catch logic bugs, tune autonomous routines, and develop during the off-season — all without build-season hardware access or risking a real mechanism.",
    },
    {
      type: "code",
      lang: "java",
      caption: "A simulated flywheel updated each sim step",
      code: "FlywheelSim flywheelSim = new FlywheelSim(motorModel, gearing, moi);\n\npublic void simulationPeriodic() {\n    flywheelSim.setInput(motor.get() * RobotController.getBatteryVoltage());\n    flywheelSim.update(0.02);\n    encoderSim.setRate(flywheelSim.getAngularVelocityRPM());\n}",
    },
    {
      type: "callout",
      tone: "info",
      md: "The pattern: in `simulationPeriodic()` you push your code's *outputs* into a physics model, advance the model, then write its results back into *simulated sensors*. Your real subsystem code doesn't change — it just reads sensors that happen to be simulated.",
    },
    {
      type: "quiz",
      question: "Why is simulation valuable to an FRC team?",
      options: [
        "It makes the real robot lighter",
        "You can develop and test robot code without physical hardware",
        "It charges the battery faster",
        "It replaces the driver",
      ],
      answerIndex: 1,
      explanation:
        "Simulation runs your real code against physics models, so you can find bugs and tune routines on a laptop — no robot required.",
    },
    {
      type: "coding",
      prompt:
        "In `simulationPeriodic()`, advance the simulation by one 20 ms step: call `flywheelSim.update(0.02)`.",
      starter: "public void simulationPeriodic() {\n    flywheelSim.setInput(motor.get() * 12.0);\n    // advance the sim by one 20ms step\n}",
      solution:
        "public void simulationPeriodic() {\n    flywheelSim.setInput(motor.get() * 12.0);\n    flywheelSim.update(0.02);\n}",
      checks: [
        { label: "Advances the sim with update(0.02)", pattern: "flywheelSim\\.update\\(\\s*0\\.02\\s*\\)" },
      ],
      hint: "`flywheelSim.update(0.02);` — 0.02 seconds is the standard 20 ms loop.",
    },
    {
      type: "text",
      md: "**Simulation closes a loop: your code's outputs drive a physics model, and the model's results get written back into *simulated sensors* your real code then reads.** Push voltage in, step the model, set the simulated encoder — your subsystem never knows the sensor isn't real. This is powerful for finding logic bugs (a flipped sign, a broken auto sequence) and even running tests in CI. But remember its limit: a model can't reproduce a jammed mechanism, a loose chain, or a wiring fault. Simulation validates *code*, not the *machine*.",
    },
    {
      type: "quiz",
      question: "Simulation runs your real robot code against physics models. Which kind of problem will it NOT catch?",
      options: [
        "A flipped sign in your control logic",
        "A physically jammed mechanism or a loose chain on the real robot",
        "An off-by-one error in an autonomous sequence",
        "A units mismatch in a conversion factor",
      ],
      answerIndex: 1,
      explanation:
        "Simulation exercises your code against an idealized model, so it catches code bugs. Physical/mechanical faults that don't exist in the model — jams, wiring, unexpected friction — are invisible to it.",
    },
    {
      type: "coding",
      prompt:
        "Close the simulation loop: after stepping the sim, write its velocity back into the simulated encoder by calling `encoderSim.setRate(flywheelSim.getAngularVelocityRPM())`.",
      starter:
        "public void simulationPeriodic() {\n    flywheelSim.setInput(motor.get() * 12.0);\n    flywheelSim.update(0.02);\n    // write the sim's velocity back into the simulated encoder\n}",
      solution:
        "public void simulationPeriodic() {\n    flywheelSim.setInput(motor.get() * 12.0);\n    flywheelSim.update(0.02);\n    encoderSim.setRate(flywheelSim.getAngularVelocityRPM());\n}",
      checks: [
        { label: "Reads the sim's angular velocity", pattern: "flywheelSim\\.getAngularVelocityRPM\\(\\s*\\)" },
        { label: "Writes it into the simulated encoder", pattern: "encoderSim\\.setRate\\(" },
      ],
      hint: "`encoderSim.setRate(flywheelSim.getAngularVelocityRPM());`",
    },
  ],
};

const canOptimization: Lesson = {
  id: "can-optimization",
  title: "CAN Bus & Software Design",
  blurb: "Keep a complex robot's code fast, reliable, and maintainable.",
  minutes: 11,
  blocks: [
    {
      type: "text",
      md: "Every motor controller and sensor talks over the **CAN bus**, a shared wire with finite bandwidth. On a swerve robot with a dozen-plus devices, flooding the bus with status frames causes lag and dropouts. Advanced teams **tune frame periods** — slowing down data they don't need so the data they *do* need arrives on time.",
    },
    {
      type: "callout",
      tone: "tip",
      md: "Pair bus discipline with **software design patterns**: keep subsystems independent, depend on small interfaces (so a real motor and a simulated one are interchangeable), and avoid magic numbers by centralizing constants. Championship codebases are readable first and clever second.",
    },
    {
      type: "text",
      md: "A common pattern is the **IO interface**: a subsystem talks to an interface, and you swap a real-hardware implementation for a simulated one. This is exactly what makes AdvantageKit-style logging and simulation possible — the subsystem never knows the difference.",
    },
    {
      type: "quiz",
      question: "Why do advanced teams tune CAN frame periods?",
      options: [
        "To make motors spin faster",
        "To avoid saturating the shared bus so critical data arrives on time",
        "To charge the battery",
        "To increase motor voltage",
      ],
      answerIndex: 1,
      explanation:
        "The CAN bus has limited bandwidth. Slowing down unneeded status frames frees capacity so latency-sensitive data isn't delayed or dropped.",
    },
    {
      type: "coding",
      prompt:
        "Define a small IO interface `MotorIO` with one method: `void setVoltage(double volts);`",
      starter: "public interface MotorIO {\n    // declare setVoltage(double volts)\n}",
      solution: "public interface MotorIO {\n    void setVoltage(double volts);\n}",
      checks: [
        { label: "Declares an interface MotorIO", pattern: "interface\\s+MotorIO" },
        { label: "Declares setVoltage(double volts)", pattern: "void\\s+setVoltage\\(\\s*double\\s+volts\\s*\\)" },
      ],
      hint: "Inside the interface body: `void setVoltage(double volts);` (no method body — interfaces just declare).",
    },
    {
      type: "text",
      md: "**The `MotorIO` interface isn't just tidy — it's what enables logging and simulation.** Because the subsystem depends on the *interface*, you can supply different implementations without touching the subsystem: a `RealMotorIO` that talks to hardware, a `SimMotorIO` backed by a physics model, and a replay implementation that feeds logged inputs. Swapping them is how AdvantageKit's deterministic replay and on-laptop simulation both work. Pair this with **CAN discipline** (slow the status frames you don't read) and centralized **constants**, and a large codebase stays fast and maintainable.",
    },
    {
      type: "quiz",
      question:
        "Slowing a motor controller's status-frame period reduces CAN bus traffic. What's the trade-off?",
      options: [
        "The motor physically spins more slowly",
        "That frame's data (e.g. position/velocity) arrives less often — so don't slow frames a control loop reads frequently",
        "The robot draws more battery current",
        "There is no trade-off; always slow every frame",
      ],
      answerIndex: 1,
      explanation:
        "A longer frame period means the signal updates less often. Slow down frames you rarely use to free bandwidth, but keep fast the ones a latency-sensitive control loop depends on.",
    },
    {
      type: "coding",
      prompt:
        "Provide a real-hardware implementation of `MotorIO`. Write `RealMotorIO` that `implements MotorIO`, and in `setVoltage(double volts)` delegates to `motor.setVoltage(volts)`.",
      starter:
        "public class RealMotorIO implements MotorIO {\n    private final PWMSparkMax motor = new PWMSparkMax(3);\n\n    // implement setVoltage by delegating to the motor\n}",
      solution:
        "public class RealMotorIO implements MotorIO {\n    private final PWMSparkMax motor = new PWMSparkMax(3);\n\n    public void setVoltage(double volts) {\n        motor.setVoltage(volts);\n    }\n}",
      checks: [
        { label: "Implements the MotorIO interface", pattern: "implements\\s+MotorIO" },
        { label: "Defines setVoltage(double volts)", pattern: "void\\s+setVoltage\\(\\s*double\\s+volts\\s*\\)" },
        { label: "Delegates to motor.setVoltage(volts)", pattern: "motor\\.setVoltage\\(\\s*volts\\s*\\)" },
      ],
      hint: "Inside the class: `public void setVoltage(double volts) { motor.setVoltage(volts); }`",
    },
  ],
};

export const advancedTrack: Track = {
  id: "advanced",
  title: "Advanced: Estimation, Tooling & Architecture",
  level: "Advanced",
  blurb:
    "Build championship-level systems — pose estimation, Kalman filtering, logging, simulation, and clean architecture.",
  modules: [
    {
      id: "estimation",
      title: "State Estimation",
      blurb: "Know where the robot is, accurately and reliably.",
      lessons: [odometry, poseEstimation, kalman],
    },
    {
      id: "tooling",
      title: "Tooling",
      blurb: "Logging and simulation, the way top teams develop.",
      lessons: [advantagekit, simulation],
    },
    {
      id: "architecture",
      title: "Systems & Architecture",
      blurb: "Keep a large codebase fast and maintainable.",
      lessons: [canOptimization],
    },
  ],
};
