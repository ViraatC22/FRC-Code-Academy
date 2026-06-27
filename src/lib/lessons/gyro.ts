import type { Lesson } from "../types";

// Gyroscopes & Heading, rebuilt in the Learn → Practice → Implement → Master
// model. Angle math is pure (modulo on doubles), so every exercise is
// runtime-testable with the gains/targets passed as parameters.

export const gyroLesson: Lesson = {
  id: "gyro",
  title: "Gyroscopes & Heading",
  blurb: "Know which way the robot is facing — and turn the short way every time.",
  difficulty: "Medium",
  minutes: 0,
  objectives: [
    "Explain what a gyro measures and why heading drifts over a match",
    "Explain why circular angles break naive subtraction",
    "Wrap any angle into [-180, 180) and compute a shortest signed turn",
    "Fix a turn-to-angle that spins the long way around",
    "Build a proportional turn-to-heading controller with output clamping",
  ],
  sections: [
    {
      kind: "learn",
      minutes: 9,
      blurb: "Heading, drift, and why angle subtraction needs wrapping.",
      blocks: [
        {
          type: "text",
          md: "A **gyroscope** measures rotation about the vertical axis — the robot's **heading**. Modern FRC robots use a gyro (a Pigeon or navX) to drive straight, turn to precise angles, and enable field-oriented swerve driving.",
        },
        {
          type: "code",
          lang: "java",
          code: "AHRS gyro = new AHRS();   // navX example\n\ndouble heading = gyro.getAngle();   // degrees, accumulates\ngyro.reset();                       // zero the heading",
        },
        {
          type: "callout",
          tone: "warn",
          md: "Gyros **drift** slowly over a match as small errors accumulate. Fine for short maneuvers, but for full-field position tracking you fuse the gyro with encoders via odometry (Advanced track).",
        },
        {
          type: "text",
          md: "**Angles are circular, and that breaks naive subtraction.** If your target heading is 170° and the gyro reads -170°, a plain `target - heading` gives 340° — so a heading controller would spin the robot almost all the way around instead of the easy 20° the other way. The fix is to **wrap** the error into [-180, 180) so the controller always takes the shortest path. WPILib's `enableContinuousInput(-180, 180)` automates this; understanding *why* is the point.",
        },
        {
          type: "callout",
          tone: "tip",
          md: "This is also why heading code uses `Rotation2d` instead of a raw degree count — its math handles wraparound correctly, so 350° + 20° gives 10°, not 370°.",
        },
      ],
    },
    {
      kind: "practice",
      minutes: 14,
      blurb: "Nail the wrap concept, trace it, then write and debug heading math.",
      blocks: [
        {
          type: "knowledgeCheck",
          title: "Knowledge check — heading",
          questions: [
            {
              question: "Why shouldn't you rely on a gyro alone for full-field position tracking?",
              options: [
                "Gyros only work indoors",
                "Gyros drift over time as small errors accumulate",
                "Gyros can't measure angles",
                "Gyros update once per match",
              ],
              answerIndex: 1,
              explanation:
                "Integration drift makes raw heading unreliable over long periods; sensor fusion (gyro + encoders) corrects it.",
            },
            {
              question: "A heading controller targets 170° while the gyro reads -170°. Why does naive subtraction misbehave?",
              options: [
                "It returns 340°, driving the robot the long way around instead of 20°",
                "It returns 0 and the robot never moves",
                "It throws an exception",
                "Nothing is wrong with it",
              ],
              answerIndex: 0,
              explanation:
                "Heading is circular, so raw subtraction can exceed 180° and command the long path. Wrapping to [-180, 180) selects the short turn.",
            },
            {
              question: "What range does wrapping an angle put it into here?",
              options: ["[0, 360)", "[-180, 180)", "[-360, 360)", "[0, 180)"],
              answerIndex: 1,
              explanation:
                "Centering the range on 0 means a positive value turns one way and a negative the other, with magnitude ≤ 180°.",
            },
            {
              question: "Which WPILib feature wraps heading error for you automatically?",
              options: [
                "setTolerance",
                "enableContinuousInput(-180, 180)",
                "gyro.reset()",
                "setDistancePerPulse",
              ],
              answerIndex: 1,
              explanation:
                "enableContinuousInput tells the PIDController its input is circular, so it wraps the error internally.",
            },
          ],
        },
        {
          type: "predict",
          prompt: "What does this wrap of 190° print?",
          code: "double deg = 190.0;\ndouble wrapped = ((deg + 180) % 360 + 360) % 360 - 180;\nSystem.out.println(wrapped);",
          options: ["-170.0", "190.0", "170.0", "10.0"],
          answerIndex: 0,
          explanation:
            "190° is 10° past 180°, i.e. 170° the other way: wrapped to -170°. The double-modulo keeps it in [-180, 180).",
        },
        {
          type: "coding",
          variant: "exercise",
          title: "Guided exercise — wrap an angle",
          prompt:
            "Write `double wrap(double deg)` that normalizes any angle into [-180, 180): `((deg + 180) % 360 + 360) % 360 - 180`.",
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
            { method: "wrap", args: [190.0], expected: -170.0, tolerance: 1e-9 },
            { method: "wrap", args: [350.0], expected: -10.0, tolerance: 1e-9 },
            { method: "wrap", args: [540.0], expected: -180.0, tolerance: 1e-9 },
            { method: "wrap", args: [0.0], expected: 0.0 },
          ],
        },
        {
          type: "coding",
          variant: "debug",
          title: "Debugging challenge — the long way around",
          prompt:
            "This turn helper returns the raw difference without wrapping, so near the ±180° seam it commands a near-360° spin. Fix `shortestTurn` to wrap the difference into [-180, 180).",
          starter:
            "public double shortestTurn(double target, double measured) {\n    double diff = target - measured;\n    return diff;   // bug: not wrapped — spins the long way near ±180\n}",
          solution:
            "public double shortestTurn(double target, double measured) {\n    double diff = target - measured;\n    return ((diff + 180) % 360 + 360) % 360 - 180;\n}",
          checks: [
            { label: "Wraps the difference with modulo 360", pattern: "%\\s*360" },
            { label: "Returns the wrapped difference", pattern: "return\\s+\\(\\(\\s*diff" },
          ],
          hint: "Apply the same wrap to `diff`: `return ((diff + 180) % 360 + 360) % 360 - 180;`.",
          tests: [
            { method: "shortestTurn", args: [170.0, -170.0], expected: -20.0, tolerance: 1e-9 },
            { method: "shortestTurn", args: [-170.0, 170.0], expected: 20.0, tolerance: 1e-9 },
            { method: "shortestTurn", args: [90.0, 0.0], expected: 90.0, tolerance: 1e-9 },
          ],
        },
      ],
    },
    {
      kind: "implement",
      minutes: 12,
      blurb: "Build the shortest-signed-turn helper every turn-to-angle command needs.",
      blocks: [
        {
          type: "text",
          md: "The shortest signed turn from a measured heading to a target is `wrap(target − measured)` — a value in [-180, 180) telling the controller both *how far* and *which way* to rotate. This single helper is the difference between a turn-to-angle that snaps efficiently and one that occasionally spins the long way around.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Implementation lab — shortest signed turn",
          prompt:
            "Write `double shortestTurn(double target, double measured)`: compute `diff = target - measured`, then wrap it into [-180, 180) with `((diff + 180) % 360 + 360) % 360 - 180`.",
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
    },
    {
      kind: "master",
      minutes: 11,
      blurb: "Turn that shortest-turn into a real proportional turn-to-heading command.",
      blocks: [
        {
          type: "text",
          md: "Now drive a motor with it. A turn-to-heading command computes the shortest signed error, multiplies by a proportional gain, and **clamps** the result to the legal motor range so a big error doesn't command an impossible output. Build `turnPower` as one pure function.",
        },
        {
          type: "coding",
          variant: "lab",
          title: "Mastery lab — proportional turn-to-heading",
          prompt:
            "Write `double turnPower(double target, double measured, double kP)`: wrap `target - measured` into [-180, 180), multiply by `kP`, then clamp the result to [-1, 1] (if it exceeds 1 set it to 1; if below -1 set it to -1). Return it.",
          starter:
            "public double turnPower(double target, double measured, double kP) {\n    double diff = target - measured;\n    double error = ((diff + 180) % 360 + 360) % 360 - 180;\n    // multiply by kP, clamp to [-1, 1], return\n}",
          solution:
            "public double turnPower(double target, double measured, double kP) {\n    double diff = target - measured;\n    double error = ((diff + 180) % 360 + 360) % 360 - 180;\n    double out = kP * error;\n    if (out > 1.0) {\n        out = 1.0;\n    }\n    if (out < -1.0) {\n        out = -1.0;\n    }\n    return out;\n}",
          checks: [
            { label: "Wraps the heading error", pattern: "%\\s*360" },
            { label: "Scales the error by kP", pattern: "kP\\s*\\*\\s*error|error\\s*\\*\\s*kP" },
            { label: "Clamps the upper bound", pattern: "out\\s*>\\s*1" },
            { label: "Clamps the lower bound", pattern: "out\\s*<\\s*-\\s*1" },
          ],
          hint: "After `double out = kP * error;`, guard both directions with `if (out > 1.0) { out = 1.0; }` and the mirror.",
          tests: [
            { method: "turnPower", args: [90.0, 0.0, 0.01], expected: 0.9, tolerance: 1e-9, label: "90° error × 0.01 → 0.9" },
            { method: "turnPower", args: [170.0, -170.0, 0.01], expected: -0.2, tolerance: 1e-9, label: "wrapped −20° → −0.2 (short way)" },
            { method: "turnPower", args: [170.0, 0.0, 0.02], expected: 1.0, tolerance: 1e-9, label: "big error clamps → 1.0" },
            { method: "turnPower", args: [0.0, 0.0, 0.01], expected: 0.0, label: "on target → 0" },
          ],
        },
        {
          type: "knowledgeCheck",
          title: "Mastery check — turn-to-angle judgment",
          questions: [
            {
              question:
                "Your turn-to-heading works near 0° but occasionally spins almost all the way around when the target is near ±180°. What's missing?",
              options: [
                "A faster gyro",
                "Wrapping the heading error into [-180, 180) before applying the gain",
                "A larger kP",
                "Resetting the gyro mid-turn",
              ],
              answerIndex: 1,
              explanation:
                "The long-way spin near the seam is the unwrapped-error bug. Wrap the error so the controller always takes the shortest path.",
            },
          ],
        },
      ],
    },
  ],
};
