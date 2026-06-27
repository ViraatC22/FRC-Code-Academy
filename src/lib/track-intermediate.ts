import type { Track, Lesson } from "./types";
import { pidLesson } from "./lessons/pid";
import { feedforwardLesson } from "./lessons/feedforward";
import { encodersLesson } from "./lessons/encoders";
import { gyroLesson } from "./lessons/gyro";

// ---------------------------------------------------------------------------
// Intermediate Track: sensors, closed-loop control, and autonomous.
// Assumes the Beginner track (command-based basics) is understood.
// ---------------------------------------------------------------------------

const pathplanner: Lesson = {
  id: "pathplanner",
  difficulty: "Hard",
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
  difficulty: "Hard",
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
  difficulty: "Medium",
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
      lessons: [encodersLesson, gyroLesson],
    },
    {
      id: "closed-loop",
      title: "Closed-Loop Control",
      blurb: "Drive measured values to targets with PID and feedforward.",
      lessons: [pidLesson, feedforwardLesson],
    },
    {
      id: "autonomous",
      title: "Autonomous & Coordination",
      blurb: "Path following, vision, and structured multi-step logic.",
      lessons: [pathplanner, visionBasics, stateMachines],
    },
  ],
};
