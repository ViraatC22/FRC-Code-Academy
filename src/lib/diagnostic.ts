import type { CodeCheck } from "./types";

// Placement test. Each item maps to one lesson. A lesson is "tested out" (marked
// complete) only when EVERY item tagged to it is answered correctly, so students
// skip lessons they've genuinely mastered. Items are intentionally different from
// the in-lesson activities.

interface BaseItem {
  /** The lesson this item helps test out of. */
  lessonId: string;
  lessonTitle: string;
}

export type DiagnosticItem =
  | (BaseItem & {
      kind: "mcq";
      question: string;
      options: string[];
      answerIndex: number;
    })
  | (BaseItem & {
      kind: "coding";
      prompt: string;
      starter: string;
      solution: string;
      checks: CodeCheck[];
    });

export const diagnostic: DiagnosticItem[] = [
  {
    kind: "mcq",
    lessonId: "variables",
    lessonTitle: "Variables",
    question: "What is the value of `x` after: `int x = 7 / 2;`?",
    options: ["3.5", "3", "4", "Error"],
    answerIndex: 1,
  },
  {
    kind: "coding",
    lessonId: "variables",
    lessonTitle: "Variables",
    prompt: "Declare a `double` named `power` set to `0.6`.",
    starter: "",
    solution: "double power = 0.6;",
    checks: [
      { label: "Declares a double named power", pattern: "double\\s+power\\s*=" },
      { label: "power is set to 0.6", pattern: "power\\s*=\\s*0\\.6\\s*;" },
    ],
  },
  {
    kind: "mcq",
    lessonId: "loops",
    lessonTitle: "Loops",
    question: "How many times does the body run? `for (int i = 1; i <= 5; i++)`",
    options: ["4", "5", "6", "Forever"],
    answerIndex: 1,
  },
  {
    kind: "mcq",
    lessonId: "functions",
    lessonTitle: "Functions (Methods)",
    question:
      "A method declared `public int score()` must do what before its closing brace?",
    options: [
      "Print a value",
      "Return an int value",
      "Take a parameter",
      "Nothing — int methods are optional about returning",
    ],
    answerIndex: 1,
  },
  {
    kind: "coding",
    lessonId: "functions",
    lessonTitle: "Functions (Methods)",
    prompt:
      "Write a method `public double half(double x)` that returns `x` divided by 2.",
    starter: "",
    solution: "public double half(double x) {\n    return x / 2.0;\n}",
    checks: [
      { label: "Declares public double half(double x)", pattern: "public\\s+double\\s+half\\s*\\(\\s*double\\s+x\\s*\\)" },
      { label: "Returns x divided by 2", pattern: "return\\s+x\\s*/\\s*2" },
    ],
  },
  {
    kind: "mcq",
    lessonId: "classes",
    lessonTitle: "Classes & Objects",
    question: "What does `new` do in `Arm arm = new Arm();`?",
    options: [
      "Declares a type",
      "Creates an instance (object) of the Arm class",
      "Imports the Arm class",
      "Marks the variable as constant",
    ],
    answerIndex: 1,
  },
  {
    kind: "mcq",
    lessonId: "java-basics",
    lessonTitle: "Java Syntax Essentials",
    question: "Which statement is syntactically valid Java?",
    options: [
      "boolean ok = True;",
      "boolean ok = true;",
      "boolean ok == true;",
      "bool ok = true;",
    ],
    answerIndex: 1,
  },
  {
    kind: "mcq",
    lessonId: "wpilib-intro",
    lessonTitle: "What is WPILib?",
    question: "Which WPILib method runs exactly once when the robot is powered on?",
    options: [
      "teleopPeriodic()",
      "robotInit()",
      "autonomousPeriodic()",
      "disabledPeriodic()",
    ],
    answerIndex: 1,
  },
  {
    kind: "mcq",
    lessonId: "motors-and-drive",
    lessonTitle: "Motors & Driving",
    question: "In `drive.arcadeDrive(speed, turn)`, what is the second argument?",
    options: [
      "Forward/back speed",
      "The rotation (turn) rate",
      "The motor port number",
      "The maximum voltage",
    ],
    answerIndex: 1,
  },
  {
    kind: "coding",
    lessonId: "motors-and-drive",
    lessonTitle: "Motors & Driving",
    prompt: "Using the existing `drive` object, make the robot drive straight forward at 75% power.",
    starter: "// one line using drive.arcadeDrive(...)\n",
    solution: "drive.arcadeDrive(0.75, 0.0);",
    checks: [
      { label: "Calls arcadeDrive with forward 0.75", pattern: "arcadeDrive\\(\\s*0\\.75" },
      { label: "No turn (second arg 0)", pattern: "arcadeDrive\\(\\s*0\\.75\\s*,\\s*0" },
    ],
  },
  {
    kind: "mcq",
    lessonId: "subsystems",
    lessonTitle: "Subsystems",
    question: "Which base class do you extend to make a command-based subsystem?",
    options: ["RobotBase", "SubsystemBase", "CommandBase", "MotorController"],
    answerIndex: 1,
  },
  {
    kind: "mcq",
    lessonId: "commands",
    lessonTitle: "Commands",
    question: "In a Command, which method signals the scheduler that the action is done?",
    options: [
      "execute() returning true",
      "isFinished() returning true",
      "end() returning true",
      "initialize() returning true",
    ],
    answerIndex: 1,
  },
  {
    kind: "coding",
    lessonId: "commands",
    lessonTitle: "Commands",
    prompt:
      "Inside a command's `execute()`, drive the `drivetrain` forward at half speed by calling its `arcade(speed, turn)` method.",
    starter: "public void execute() {\n    // drive forward at 0.5\n}",
    solution: "public void execute() {\n    drivetrain.arcade(0.5, 0);\n}",
    checks: [
      { label: "Calls drivetrain.arcade(...)", pattern: "drivetrain\\.arcade\\(" },
      { label: "Forward speed is 0.5", pattern: "arcade\\(\\s*0\\.5" },
    ],
  },
];

/** Unique lesson ids covered by the diagnostic, in first-seen order. */
export function diagnosticLessonIds(): string[] {
  const seen: string[] = [];
  for (const item of diagnostic) {
    if (!seen.includes(item.lessonId)) seen.push(item.lessonId);
  }
  return seen;
}
