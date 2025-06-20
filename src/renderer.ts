import "./index.css";

import { Problem, ProblemsRecordSchema, TestCase, TestResult } from "./types";

let currentPage = 1;
let currentProblemId: string | null = null;
let problemsRecord: Record<string, Problem> | null = null;
let problemsArray: Problem[] | null = null;

const PROBLEMS_PER_PAGE = 3;

window.onload = async () => {
  const searchInput = document.getElementById("search")! as HTMLInputElement;
  const problemsList = document.getElementById("problem-list")! as HTMLUListElement;
  const testBtn = document.getElementById("test")! as HTMLButtonElement;
  const tryBtn = document.getElementById("try")! as HTMLButtonElement;
  const chooseFileBtn = document.getElementById("file")! as HTMLButtonElement;
  const chooseFolderBtn = document.getElementById("folder")! as HTMLButtonElement;
  const folderPathLabel = document.getElementById("folder-path")! as HTMLLabelElement;
  const filePathLabel = document.getElementById("file-path")! as HTMLLabelElement;

  const localStorageFilePath = localStorage.getItem("filePath");
  if (localStorageFilePath) {
    const data = await readFile(localStorageFilePath);
    setFilePath(localStorageFilePath, filePathLabel, data);
    if (problemsArray) loadProblems(problemsList, problemsArray);
  }

  const localStorageFolderPath = localStorage.getItem("folderPath");
  if (localStorageFolderPath) {
    setFolderPath(localStorageFolderPath, folderPathLabel);
  }

  chooseFileBtn.addEventListener("click", async (e: Event) => {
    e.preventDefault();
    const filePath = await getFilePath();
    const data = await readFile(filePath);
    setFilePath(filePath, filePathLabel, data);
    if (problemsArray) loadProblems(problemsList, problemsArray);
  });

  chooseFolderBtn.addEventListener("click", async (e: Event) => {
    e.preventDefault();
    const folderPath = await getFolderPath();
    setFolderPath(folderPath, folderPathLabel);
  });

  searchProblemListener(problemsList, searchInput);
  tryProblemListener(tryBtn);
  testProblemListener(testBtn);
};

function testProblemListener(testBtn: HTMLButtonElement){
  const debouncedTest = debounce(async () => {
    const folderPath = localStorage.getItem("folderPath");
    const filePath = localStorage.getItem("filePath");
    if(isMissingVariable({
      problemsArray,
      folderPath,
      filePath,
      problemsRecord,
      problemTemplate: problemsRecord?.[currentProblemId]?.template,
    })) return;
    // @ts-ignore

    const { content } = await window.electronAPI.readFile(folderPath + "/a.js");
    const func = new Function(`${content}; return arguments[0];`)(eval(`(${content})`));
    const testResult = runTests(func,  problemsRecord?.[currentProblemId]?.tests)
    if (testResult.every((test) => test.passed)) {
      alert("Approved test");
    } else {
      alert("Not approved");
    }
  },1000)

  testBtn.addEventListener("click", async(e) => {
    e.preventDefault();
    debouncedTest();
  })
}

async function readFile(filePath: string): Promise<Record<string, Problem>> {
  // @ts-ignore
  const { success, content } = await window.electronAPI.readFile(filePath);
  const parsed = JSON.parse(content);
  const result = ProblemsRecordSchema.safeParse(parsed);
  if (!result.success || !success) {
    alert("Invalid json check markdown file to follow the conventions");
    return;
  }
  return result.data as Record<string, Problem>;
}

async function getFilePath(): Promise<string> {
  // @ts-ignore
  const path = await window.electronAPI.openFile();
  if (!path) return;
  return path;
}

function setFilePath(path: string, filePathLabel: HTMLLabelElement, data: Record<string, Problem>) {
  const localFilePath: string | null = localStorage.getItem("filePath");
  if (!localFilePath || localFilePath !== path) localStorage.setItem("filePath", path);
  filePathLabel.innerText = path;
  problemsRecord = data;
  problemsArray = Object.values(data) as Problem[];
}

async function getFolderPath(): Promise<string> {
  // @ts-ignore
  const path = await window.electronAPI.openDirectory();
  if (!path) return;
  return path;
}

function setFolderPath(folderPath: string, folderPathLabel: HTMLLabelElement) {
  const localFolderPath: string | null = localStorage.getItem("folderPath");
  if (!localFolderPath || localFolderPath !== folderPath)
    localStorage.setItem("folderPath", folderPath);
  folderPathLabel.innerText = folderPath;
}

function isMissingVariable(vars: Record<string, any>): boolean {
  const missing = Object.entries(vars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    alert("Some things are missing: " + missing.join(", "));
    return true;
  }
  return false;
}

function tryProblemListener(tryBtn: HTMLButtonElement) {
  const debouncedTry = debounce(async () => {
    const folderPath = localStorage.getItem("folderPath");
    const filePath = localStorage.getItem("filePath");
    const isMissing = isMissingVariable({
      selectedProblem: currentProblemId,
      problemsArray,
      folderPath,
      filePath,
      problemsRecord,
      problemTemplate: problemsRecord?.[currentProblemId]?.template,
    });

    if (isMissing) return;

    // @ts-ignore
    const a = await window.electronAPI.tryProblem(
      folderPath,
      problemsRecord[currentProblemId].template
    );
  }, 1000);

  tryBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await debouncedTry();
  });
}

function loadProblems(
  problemsList: HTMLUListElement,
  filteredProblems: Problem[],
  page: number = 1
): void {
  problemsList.innerHTML = "";

  const start = (page - 1) * PROBLEMS_PER_PAGE;
  const end = start + PROBLEMS_PER_PAGE;
  const paginated = filteredProblems.slice(start, end);

  for (const problem of paginated) {
    const problemTitle = document.createElement("h4");
    problemTitle.innerText = problem.title;
    problemTitle.className = "problem-title";

    const problemDescription = document.createElement("p");
    problemDescription.innerText = problem.description;
    problemDescription.className = "problem-desc";

    const problemContainer = document.createElement("li");
    problemContainer.id = problem.id;
    problemContainer.className = "problem-container";
    problemContainer.append(problemTitle, problemDescription);
    problemContainer.addEventListener("click", () => {
      const previouslySelected = document.querySelector(".selected-problem");
      if (previouslySelected) {
        previouslySelected.classList.remove("selected-problem");
      }

      if (currentProblemId !== problem.id) {
        problemContainer.classList.add("selected-problem");
        currentProblemId = problem.id;
      } else {
        currentProblemId = null;
      }
    });

    problemsList.appendChild(problemContainer);
  }

  renderPagination(filteredProblems.length, page);
}

function searchProblemListener(problemsList: HTMLUListElement, searchInput: HTMLInputElement) {
  const debouncedSearch = debounce((inputValue: string) => {
    const filteredProblems = problemsArray.filter(({ title }) =>
      title.toLowerCase().includes(inputValue)
    );
    currentPage = 1;
    loadProblems(problemsList, filteredProblems, currentPage);
  }, 500);

  searchInput.addEventListener("input", (e: Event) =>
    debouncedSearch((e.target as HTMLInputElement).value.trim().toLowerCase())
  );
}

function renderPagination(total: number, page: number) {
  const pagination = document.getElementById("pagination")!;
  pagination.innerHTML = "";
  const totalPages = Math.ceil(total / PROBLEMS_PER_PAGE);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i.toString();
    btn.disabled = i === page;
    btn.className = "pagination-btn";
    btn.onclick = () => {
      currentPage = i;
      loadProblems(
        document.getElementById("problem-list") as HTMLUListElement,
        problemsArray,
        currentPage
      );
    };
    pagination.appendChild(btn);
  }
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let time: null | ReturnType<typeof setTimeout> = null;
  return (...args: Parameters<T>) => {
    if (time) clearTimeout(time);
    time = setTimeout(() => fn(...args), delay);
  };
}

function runTests(func: (...args: any[]) => any, tests: TestCase[]): TestResult[] {
  return tests.map(({ input, expected }, i) => {
    try {
      const result = func(...input);
      return {
        test: i + 1,
        passed: result === expected,
        result,
        expected,
      };
    } catch (e: any) {
      return {
        test: i + 1,
        passed: false,
        error: e.message,
      };
    }
  });
}
