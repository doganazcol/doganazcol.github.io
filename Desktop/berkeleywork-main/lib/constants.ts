// Standardized classes list used across the application
export const CLASSES = [
  "CS 61A: Structure and Interpretation of Computer Programs",
  "CS 61B: Data Structures",
  "CS 61C: Machine Structures",
  "CS 70: Discrete Mathematics and Probability Theory",
  "CS 188: Introduction to Artificial Intelligence",
  "CS 189: Introduction to Machine Learning",
  "CS 170: Efficient Algorithms and Intractable Problems",
  "CS 186: Introduction to Database Systems",
  "CS 168: The Internet: Architecture and Protocols",
  "CS 164: Programming Languages and Compilers"
];

// Class objects format for component that needs value/label pairs
export const CLASS_OPTIONS = [
  { value: "all", label: "All Classes" },
  ...CLASSES.map(classItem => ({
    value: classItem,
    label: classItem
  }))
]; 