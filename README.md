# 📘 Code Problem Tester Desktop App

This is a minimal desktop application inspired by LeetCode. It allows you to load coding problems from a JSON file, solve them in your local editor, and test your solutions with instant feedback.

---

## ✨ Features

- Load problems from a JSON file (`problems.json`)
- Select a folder where problem templates will be written
- Solve the problem using your preferred editor
- Click **Try** to run your code against predefined test cases
- Instant feedback: get "Approved test" or "Not approved"

---

## 📂 Setup

1. **Load problems file**  
   Click `Choose File` and select the `problems.json` file (located at `/root/problems.json` or any compatible file).

2. **Select working folder**  
   Click `Choose Folder` and select the directory where problem templates will be saved (e.g., `a.ts` for solving).

3. **Solve problems**  
   Write your solution in the generated file using your editor.

4. **Run tests**  
   Click **Try** or **Test** to run the current solution against its test cases.

---

## 📝 `problems.json` Format

```json
{
  "binarySearch": {
    "id": "binarySearch",
    "title": "Binary Search",
    "description": "Search a value in a sorted array.",
    "template": "function binarySearch(nums, target) { }",
    "tests": [
      { "input": [[1, 2, 3, 4, 5], 3], "expected": 2 },
      { "input": [[1, 2, 3, 4, 5], 6], "expected": -1 }
    ]
  }
}
```
