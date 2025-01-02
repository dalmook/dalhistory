// 전역 변수
let timelineData = [];
let quizData = [];
let currentQuizIndex = 0;
let score = 0;
let answeredQuestions = 0;

// DOM 요소
const studyModeSection = document.getElementById("studyMode");
const quizModeSection = document.getElementById("quizMode");
const searchResultsSection = document.getElementById("searchResults");
const timelineContainer = document.getElementById("timelineContainer");
const quizContainer = document.getElementById("quizContainer");
const resultsContainer = document.getElementById("resultsContainer");

const studyModeBtn = document.getElementById("studyModeBtn");
const quizModeBtn = document.getElementById("quizModeBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const scoreDisplay = document.getElementById("score");
const progressDisplay = document.getElementById("progress");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// 모드 전환 함수
function showStudyMode() {
  studyModeSection.classList.remove("hidden");
  quizModeSection.classList.add("hidden");
  searchResultsSection.classList.add("hidden");
}

function showQuizMode() {
  studyModeSection.classList.add("hidden");
  quizModeSection.classList.remove("hidden");
  searchResultsSection.classList.add("hidden");
}

function showSearchResults() {
  studyModeSection.classList.add("hidden");
  quizModeSection.classList.add("hidden");
  searchResultsSection.classList.remove("hidden");
}

// 타임라인 생성 함수
function renderTimeline(filteredData = null) {
  timelineContainer.innerHTML = "";
  const dataToRender = filteredData || timelineData;

  if (dataToRender.length === 0) {
    timelineContainer.innerHTML = "<p>검색 결과가 없습니다.</p>";
    return;
  }

  dataToRender.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("timeline-item");

    div.innerHTML = `
      <h3>${item.period} (${item.startYear} ~ ${item.endYear})</h3>
      <p>${item.description}</p>
    `;
    timelineContainer.appendChild(div);
  });
}

// 퀴즈 화면 렌더링
function renderQuiz() {
  quizContainer.innerHTML = "";

  const currentQuiz = quizData[currentQuizIndex];
  if (!currentQuiz) return;

  // 문제
  const questionEl = document.createElement("div");
  questionEl.classList.add("quiz-question");
  questionEl.textContent = `Q${currentQuizIndex + 1}. ${currentQuiz.question}`;
  quizContainer.appendChild(questionEl);

  // 보기
  const optionsEl = document.createElement("div");
  optionsEl.classList.add("quiz-options");

  currentQuiz.options.forEach(option => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.value = option;

    // 이미 답변한 경우 선택 상태 유지
    if (currentQuiz.userAnswer === option) {
      input.checked = true;
    }

    label.appendChild(input);
    label.append(` ${option}`);
    optionsEl.appendChild(label);
  });

  quizContainer.appendChild(optionsEl);

  // 피드백 표시
  if (currentQuiz.feedback) {
    const feedbackEl = document.createElement("div");
    feedbackEl.classList.add("feedback");
    feedbackEl.textContent = currentQuiz.feedback;
    feedbackEl.classList.add(currentQuiz.isCorrect ? "correct" : "incorrect");
    quizContainer.appendChild(feedbackEl);
  }
}

// 이전 문제
function showPrevQuiz() {
  if (currentQuizIndex > 0) {
    currentQuizIndex--;
    renderQuiz();
  }
}

// 다음 문제
function showNextQuiz() {
  const currentQuiz = quizData[currentQuizIndex];
  const selectedOption = document.querySelector('input[name="answer"]:checked');

  // 답변 확인
  if (selectedOption && !currentQuiz.feedback) {
    currentQuiz.userAnswer = selectedOption.value;
    if (selectedOption.value === currentQuiz.answer) {
      currentQuiz.isCorrect = true;
      score += 1;
      currentQuiz.feedback = "정답입니다!";
    } else {
      currentQuiz.isCorrect = false;
      currentQuiz.feedback = `오답입니다. 정답은 "${currentQuiz.answer}"입니다.`;
    }
    answeredQuestions += 1;
    updateProgress();
    saveProgress();
    renderQuiz();
  }

  // 마지막 문제에서 더 이상 진행하지 않도록
  if (currentQuizIndex < quizData.length - 1) {
    currentQuizIndex++;
    renderQuiz();
  }
}

// 점수 및 진도 업데이트
function updateProgress() {
  scoreDisplay.textContent = `점수: ${score}`;
  progressDisplay.textContent = `진도: ${answeredQuestions}/${quizData.length}`;
}

// 검색 기능
function performSearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (query === "") {
    alert("검색어를 입력해주세요.");
    return;
  }

  const results = timelineData.filter(item => 
    item.period.toLowerCase().includes(query) ||
    item.description.toLowerCase().includes(query)
  );

  showSearchResults();
  renderTimeline(results);
}

// 검색 이벤트
searchBtn.addEventListener("click", performSearch);
searchInput.addEventListener("keypress", function(e) {
  if (e.key === 'Enter') {
    performSearch();
  }
});

// 답변 선택 이벤트
quizContainer.addEventListener("change", function(e) {
  const currentQuiz = quizData[currentQuizIndex];
  if (e.target.name === "answer" && !currentQuiz.feedback) {
    // 실시간으로 사용자 답변을 저장할 수 있지만, 피드백은 '다음' 버튼 클릭 시 제공
    currentQuiz.userAnswer = e.target.value;
  }
});

// 초기화 함수
async function init() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();
    timelineData = data.timeline;
    quizData = data.quiz;

    // 로컬 스토리지에서 저장된 점수와 진도 불러오기
    const savedScore = localStorage.getItem("score");
    const savedAnswered = localStorage.getItem("answeredQuestions");
    const savedQuizData = localStorage.getItem("quizData");

    if (savedScore !== null && savedAnswered !== null && savedQuizData !== null) {
      score = parseInt(savedScore, 10);
      answeredQuestions = parseInt(savedAnswered, 10);
      quizData = JSON.parse(savedQuizData);
      updateProgress();
    } else {
      updateProgress();
    }

    // 초기: 학습 모드 먼저 보이기
    showStudyMode();
    renderTimeline();
    renderQuiz();
  } catch (error) {
    console.error("JSON 데이터 불러오기 실패:", error);
  }
}

// 진도 저장 함수
function saveProgress() {
  localStorage.setItem("score", score);
  localStorage.setItem("answeredQuestions", answeredQuestions);
  localStorage.setItem("quizData", JSON.stringify(quizData));
}

// 이벤트 바인딩
studyModeBtn.addEventListener("click", showStudyMode);
quizModeBtn.addEventListener("click", showQuizMode);
prevBtn.addEventListener("click", showPrevQuiz);
nextBtn.addEventListener("click", showNextQuiz);

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", init);
