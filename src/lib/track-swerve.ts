import type { Lesson, Track } from "./types";

// Swerve Academy — a specialist track on the math and code behind swerve drive.
// The exercises are deliberately pure functions so the in-browser Java
// interpreter (src/lib/java) can actually RUN and test the learner's math.

const swerveIntro: Lesson = {
  id: "swerve-intro",
  title: "What Makes Swerve Special",
  blurb: "Independent steer + drive on every wheel — and why teams obsess over it.",
  minutes: 9,
  blocks: [
    {
      type: "text",
      md: "A **swerve drive** puts two motors on every corner of the robot: one to *drive* the wheel and one to *steer* it to any angle. Because each module points independently, the robot can translate in any direction while simultaneously rotating — true **holonomic** motion. A tank/west-coast drive can only push along its wheels; swerve decouples translation from heading entirely.",
    },
    {
      type: "callout",
      tone: "info",
      md: "A module's full state is two numbers: a **speed** (meters/second) and an **angle** (the direction the wheel points). Everything in swerve code is about turning a driver's intent into four of these `(speed, angle)` pairs — and back.",
    },
    {
      type: "code",
      lang: "java",
      caption: "The data every swerve module is built around",
      code: "// WPILib models this as SwerveModuleState(speedMetersPerSecond, Rotation2d angle)\ndouble speed = 3.2;          // how fast this wheel should spin\ndouble angleRadians = 0.78;  // which way it should point (~45°)",
    },
    {
      type: "text",
      md: "The driver gives you a **chassis speed**: a forward velocity `vx`, a sideways velocity `vy`, and a rotational velocity `omega`. The wheel's job is to carry the robot's translation, so the *speed* of a module that only translates is just the magnitude of the velocity vector `(vx, vy)`.",
    },
    {
      type: "quiz",
      question:
        "The driver pushes the stick fully forward AND fully right, with no rotation. What does a swerve robot do that a tank drive cannot?",
      options: [
        "Drive diagonally (forward-right) while keeping the same heading",
        "Spin faster than a tank drive",
        "Nothing different — both drive forward only",
        "Drive forward, then stop and strafe right",
      ],
      answerIndex: 0,
      explanation:
        "Swerve points all four modules along the combined (vx, vy) vector, so the robot translates diagonally without turning. A tank drive can only move along its wheel axis, so it physically can't strafe.",
    },
    {
      type: "coding",
      prompt:
        "For a pure-translation command, a module's drive speed is the magnitude of the velocity vector. Write `double moduleSpeed(double vx, double vy)` returning the length of `(vx, vy)`.",
      starter:
        "public double moduleSpeed(double vx, double vy) {\n    // return the magnitude of the (vx, vy) vector\n}",
      solution:
        "public double moduleSpeed(double vx, double vy) {\n    return Math.hypot(vx, vy);\n}",
      checks: [
        { label: "Declares moduleSpeed(double, double)", pattern: "double\\s+moduleSpeed\\s*\\(" },
        { label: "Returns a magnitude (hypot or sqrt)", pattern: "Math\\.hypot|Math\\.sqrt" },
      ],
      hint: "`Math.hypot(a, b)` returns `sqrt(a*a + b*b)` without overflow — exactly the vector length.",
      tests: [
        { method: "moduleSpeed", args: [3.0, 4.0], expected: 5.0 },
        { method: "moduleSpeed", args: [0.0, 0.0], expected: 0.0 },
        { method: "moduleSpeed", args: [1.0, 0.0], expected: 1.0 },
        { method: "moduleSpeed", args: [-3.0, 4.0], expected: 5.0 },
      ],
    },
  ],
};

const swerveKinematics: Lesson = {
  id: "swerve-kinematics",
  title: "Module Angles with atan2",
  blurb: "Turn a velocity vector into the angle each wheel must point.",
  minutes: 11,
  blocks: [
    {
      type: "text",
      md: "If a module must carry the velocity `(vx, vy)`, which way does the wheel point? Toward the vector. The angle of a 2-D vector is `atan2(vy, vx)` — and you must use **`atan2`, not `atan(vy/vx)`**. Plain `atan` loses the sign information and can't tell `(-1, -1)` (pointing down-left) from `(1, 1)` (up-right); `atan2` keeps the full -π to π range and never divides by zero when `vx == 0`.",
    },
    {
      type: "code",
      lang: "java",
      caption: "atan2 resolves the full circle; atan cannot",
      code: "Math.atan2(1, 1);    //  0.785 rad  (+45°, up-right)\nMath.atan2(-1, -1);  // -2.356 rad (-135°, down-left)\nMath.atan2(1, 0);    //  1.571 rad (+90°, straight up) — no divide-by-zero",
    },
    {
      type: "callout",
      tone: "tip",
      md: "Argument order is the classic trap: it's `atan2(y, x)` — **y first**. Swapping them mirrors every angle across the 45° line and your robot will steer to bizarre directions.",
    },
    {
      type: "quiz",
      question:
        "Why does WPILib's kinematics use `atan2(vy, vx)` instead of `atan(vy / vx)` for module angles?",
      options: [
        "atan2 is faster on the roboRIO",
        "atan2 returns degrees while atan returns radians",
        "atan2 covers all four quadrants and is defined when vx is 0, so it gives the true wheel direction",
        "There is no real difference; either works",
      ],
      answerIndex: 2,
      explanation:
        "`atan(vy/vx)` only spans -90°..90° and divides by zero at vx=0, so it can't distinguish forward from backward or handle pure-sideways motion. `atan2(vy, vx)` resolves the full circle and is defined everywhere.",
    },
    {
      type: "coding",
      prompt:
        "Write `double moduleAngle(double vx, double vy)` that returns the angle (radians) the wheel must point to carry velocity `(vx, vy)`.",
      starter:
        "public double moduleAngle(double vx, double vy) {\n    // return the direction of (vx, vy) in radians\n}",
      solution:
        "public double moduleAngle(double vx, double vy) {\n    return Math.atan2(vy, vx);\n}",
      checks: [
        { label: "Declares moduleAngle(double, double)", pattern: "double\\s+moduleAngle\\s*\\(" },
        { label: "Uses atan2 with (vy, vx) order", pattern: "Math\\.atan2\\(\\s*vy\\s*,\\s*vx\\s*\\)" },
      ],
      hint: "It's a one-liner: `return Math.atan2(vy, vx);` — y first, then x.",
      tests: [
        { method: "moduleAngle", args: [1.0, 0.0], expected: 0.0 },
        { method: "moduleAngle", args: [0.0, 1.0], expected: 1.5707963267948966 },
        { method: "moduleAngle", args: [1.0, 1.0], expected: 0.7853981633974483 },
        { method: "moduleAngle", args: [-1.0, 0.0], expected: 3.141592653589793 },
      ],
    },
  ],
};

const fieldOriented: Lesson = {
  id: "swerve-field-oriented",
  title: "Field-Oriented Control",
  blurb: "Make “push forward” mean forward on the field, not on the robot.",
  minutes: 12,
  blocks: [
    {
      type: "text",
      md: "In **field-oriented** drive, pushing the stick away from you always moves the robot away from you across the field — no matter which way the robot is *facing*. This is what makes swerve feel magical to drive. The trick: the joystick gives a vector in **field coordinates**, but the modules live in **robot coordinates**, so you rotate the field vector by **negative the robot's heading** before handing it to kinematics.",
    },
    {
      type: "text",
      md: "Rotating a vector `(fx, fy)` by `-heading` is a standard 2-D rotation:\n\n`robotX =  fx·cos(heading) + fy·sin(heading)`\n\n`robotY = -fx·sin(heading) + fy·cos(heading)`",
    },
    {
      type: "code",
      lang: "java",
      caption: "WPILib gives you this for free — but you should know what it does",
      code: "// Equivalent to ChassisSpeeds.fromFieldRelativeSpeeds(vx, vy, omega, gyroAngle)\ndouble robotX =  fx * Math.cos(h) + fy * Math.sin(h);\ndouble robotY = -fx * Math.sin(h) + fy * Math.cos(h);",
    },
    {
      type: "callout",
      tone: "warn",
      md: "Field-oriented drive is only as good as your **gyro zero**. If the heading is wrong by 30°, every translation is skewed by 30°. Teams re-zero the gyro at the start of every match with the robot pointed in a known direction.",
    },
    {
      type: "quiz",
      question:
        "The robot is rotated 90° counter-clockwise from its starting heading. The driver pushes straight forward (field +x). In field-oriented mode, the modules should point…",
      options: [
        "Straight ahead relative to the robot",
        "90° clockwise relative to the robot, so motion stays forward on the field",
        "Backward relative to the robot",
        "It doesn't matter; field-oriented ignores heading",
      ],
      answerIndex: 1,
      explanation:
        "The field vector is rotated by -heading into robot frame. With the robot turned 90° CCW, 'field forward' is 90° CW in the robot's own frame, so that's where the wheels point — keeping the robot moving forward on the field.",
    },
    {
      type: "coding",
      prompt:
        "Write `double robotX(double fx, double fy, double heading)` that returns the robot-frame X component of a field vector `(fx, fy)`, using `robotX = fx·cos(heading) + fy·sin(heading)`.",
      starter:
        "public double robotX(double fx, double fy, double heading) {\n    // rotate the field vector into the robot frame and return its X\n}",
      solution:
        "public double robotX(double fx, double fy, double heading) {\n    return fx * Math.cos(heading) + fy * Math.sin(heading);\n}",
      checks: [
        { label: "Declares robotX(double, double, double)", pattern: "double\\s+robotX\\s*\\(" },
        { label: "Uses cos(heading)", pattern: "Math\\.cos\\(\\s*heading\\s*\\)" },
        { label: "Uses sin(heading)", pattern: "Math\\.sin\\(\\s*heading\\s*\\)" },
      ],
      hint: "`return fx * Math.cos(heading) + fy * Math.sin(heading);`",
      tests: [
        { method: "robotX", args: [1.0, 0.0, 0.0], expected: 1.0 },
        { method: "robotX", args: [0.0, 1.0, 1.5707963267948966], expected: 1.0 },
        { method: "robotX", args: [1.0, 0.0, 1.5707963267948966], expected: 0.0 },
        { method: "robotX", args: [2.0, 0.0, 3.141592653589793], expected: -2.0 },
      ],
    },
  ],
};

const swerveOptimize: Lesson = {
  id: "swerve-optimize",
  title: "Angle Optimization",
  blurb: "Never spin a module more than 90° — reverse the wheel instead.",
  minutes: 12,
  blocks: [
    {
      type: "text",
      md: "Suppose a module points at 10° and the next command wants 170°. Naively the steering motor swings 160° — slow, and it scrubs the wheel. But a wheel is symmetric: pointing at 170° and driving forward is identical to pointing at **-10°** and driving **backward**. So instead of turning 160°, turn just 20° the other way and invert the drive. This **module optimization** is why good swerve feels instant.",
    },
    {
      type: "text",
      md: "The rule: compute the angular difference between target and current, wrap it into the range -180°..180°, and if its magnitude exceeds 90°, it's shorter to reverse the drive and steer to the opposite angle.",
    },
    {
      type: "code",
      lang: "java",
      caption: "WPILib's SwerveModuleState.optimize() does exactly this",
      code: "double delta = targetDeg - currentDeg;\nwhile (delta > 180)  delta -= 360;   // wrap to shortest path\nwhile (delta < -180) delta += 360;\nboolean reverse = Math.abs(delta) > 90;  // flipping is shorter",
    },
    {
      type: "callout",
      tone: "tip",
      md: "Angle wrapping (`while (delta > 180) delta -= 360;`) is the same shortest-path idea you met with gyros — here it decides *steering effort* instead of heading error.",
    },
    {
      type: "quiz",
      question:
        "A module is at 0° and is commanded to 175°. With optimization, what happens?",
      options: [
        "Steer 175° forward — optimization only helps past 180°",
        "Steer to -5° and drive in reverse, a 5° move instead of 175°",
        "Steer to 90° as a compromise",
        "Refuse the command because it's more than 90°",
      ],
      answerIndex: 1,
      explanation:
        "175° wrapped is 175° (already in range), and |175°| > 90°, so flipping is shorter: steer to 175°-180° = -5° and reverse the drive. The wheel moves 5° instead of 175° and carries the robot identically.",
    },
    {
      type: "coding",
      prompt:
        "Write `boolean shouldReverse(double targetDeg, double currentDeg)`. Compute `delta = targetDeg - currentDeg`, wrap it into -180..180 with two `while` loops, and return `true` when `Math.abs(delta) > 90`.",
      starter:
        "public boolean shouldReverse(double targetDeg, double currentDeg) {\n    double delta = targetDeg - currentDeg;\n    // wrap delta into [-180, 180], then decide\n}",
      solution:
        "public boolean shouldReverse(double targetDeg, double currentDeg) {\n    double delta = targetDeg - currentDeg;\n    while (delta > 180) {\n        delta -= 360;\n    }\n    while (delta < -180) {\n        delta += 360;\n    }\n    return Math.abs(delta) > 90.0;\n}",
      checks: [
        { label: "Declares shouldReverse(double, double)", pattern: "boolean\\s+shouldReverse\\s*\\(" },
        { label: "Wraps the high side (delta -= 360)", pattern: "delta\\s*-=\\s*360|delta\\s*=\\s*delta\\s*-\\s*360" },
        { label: "Wraps the low side (delta += 360)", pattern: "delta\\s*\\+=\\s*360|delta\\s*=\\s*delta\\s*\\+\\s*360" },
        { label: "Reverses when |delta| > 90", pattern: "Math\\.abs\\(\\s*delta\\s*\\)\\s*>\\s*90" },
      ],
      hint: "Two while loops to wrap, then `return Math.abs(delta) > 90.0;`.",
      tests: [
        { method: "shouldReverse", args: [0.0, 0.0], expected: false },
        { method: "shouldReverse", args: [175.0, 0.0], expected: true },
        { method: "shouldReverse", args: [45.0, 0.0], expected: false },
        { method: "shouldReverse", args: [200.0, 0.0], expected: true },
        { method: "shouldReverse", args: [-170.0, 0.0], expected: true },
        { method: "shouldReverse", args: [90.0, 0.0], expected: false },
      ],
    },
  ],
};

export const swerveTrack: Track = {
  id: "swerve",
  title: "Swerve Academy",
  level: "Specialist",
  blurb:
    "Go deep on the math and code behind swerve drive — kinematics, field-oriented control, and module optimization.",
  modules: [
    {
      id: "swerve-foundations",
      title: "Swerve Foundations",
      blurb: "What swerve is and the vector math underneath it.",
      lessons: [swerveIntro, swerveKinematics],
    },
    {
      id: "swerve-control",
      title: "Driving Swerve Well",
      blurb: "Field-oriented control and the optimization that makes it snappy.",
      lessons: [fieldOriented, swerveOptimize],
    },
  ],
};
