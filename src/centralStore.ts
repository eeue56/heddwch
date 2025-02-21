import {
  AppState,
  ClaimReviewRaw,
  DebuggingInfo,
  RenderBroadcast,
  Topic,
  TypedBroadcastChannel,
  Update,
} from "./types";

import NORWEGIAN_CREDIBLE_CLAIMS from "./data/norwegian_credible.json";
import NORWEGIAN_NOT_CREDIBLE_CLAIMS from "./data/norwegian_not_credible.json";

import UK_CREDIBLE_CLAIMS from "./data/uk_credible.json";
import UK_NOT_CREDIBLE_CLAIMS from "./data/uk_not_credible.json";

import USA_CREDIBLE_CLAIMS from "./data/usa_credible.json";
import USA_NOT_CREDIBLE_CLAIMS from "./data/usa_not_credible.json";

import SWEDEN_CREDIBLE_CLAIMS from "./data/sweden_credible.json";
import SWEDEN_NOT_CREDIBLE_CLAIMS from "./data/sweden_not_credible.json";

function makeClaims(topic: Topic): ClaimReviewRaw[] {
  let credibleClaims: ClaimReviewRaw[] =
    NORWEGIAN_CREDIBLE_CLAIMS as ClaimReviewRaw[];
  let notCredibleClaims: ClaimReviewRaw[] =
    NORWEGIAN_NOT_CREDIBLE_CLAIMS as ClaimReviewRaw[];
  switch (topic) {
    case "Norway": {
      credibleClaims = NORWEGIAN_CREDIBLE_CLAIMS as ClaimReviewRaw[];
      notCredibleClaims = NORWEGIAN_NOT_CREDIBLE_CLAIMS as ClaimReviewRaw[];
      break;
    }
    case "USA": {
      credibleClaims = USA_CREDIBLE_CLAIMS as ClaimReviewRaw[];
      notCredibleClaims = USA_NOT_CREDIBLE_CLAIMS as ClaimReviewRaw[];
      break;
    }
    case "UK": {
      credibleClaims = UK_CREDIBLE_CLAIMS as ClaimReviewRaw[];
      notCredibleClaims = UK_NOT_CREDIBLE_CLAIMS as ClaimReviewRaw[];
      break;
    }
    case "Sweden": {
      credibleClaims = SWEDEN_CREDIBLE_CLAIMS as ClaimReviewRaw[];
      notCredibleClaims = SWEDEN_NOT_CREDIBLE_CLAIMS as ClaimReviewRaw[];
      break;
    }
  }

  const claims: ClaimReviewRaw[] = [];
  for (let i = 0; i < 11; i++) {
    if (Math.floor(Math.random() * 100) < 50) {
      claims.push(credibleClaims[i] as ClaimReviewRaw);
    } else {
      claims.push(notCredibleClaims[i] as ClaimReviewRaw);
    }
  }

  return claims;
}

const renderChannel = TypedBroadcastChannel<RenderBroadcast>("render");

let appState: AppState = {
  kind: "AppState",
  quizState: { kind: "LoadedPage" },
  claimsOpenGraphData: {},
};

let debuggingInfo: DebuggingInfo = {
  kind: "DebuggingInfo",
  eventLog: [],
};

function sendRerender(state: AppState): number {
  renderChannel.postMessage({
    kind: "rerender",
    state: state,
    debuggingInfo: debuggingInfo,
  });
  return 0;
}

function dontRerender(state: AppState): number {
  return 0;
}

function update(event: MessageEvent<Update>): number {
  const data = event.data;
  console.info("ServiceWorker: received event", data.kind);

  // just ignore debug info if it doesn't exist, to avoid breaking the update loop
  try {
    debuggingInfo.eventLog.push(data.kind);
  } catch (error) {
    console.error(
      "ServiceWorker: unable to add event",
      data.kind,
      "to the event log due to",
      error
    );
  }

  switch (data.kind) {
    case "ReadyToRender": {
      return sendRerender(appState);
    }
    case "SetDebuggingInfo": {
      debuggingInfo = data.info;
      return sendRerender(appState);
    }
    case "Noop": {
      return sendRerender(appState);
    }
    case "ClickedTrue": {
      if (appState.quizState.kind === "InQuiz") {
        appState.quizState.previousAnswers.push(true);
      }
      return sendRerender(appState);
    }
    case "ClickedFalse": {
      if (appState.quizState.kind === "InQuiz") {
        appState.quizState.previousAnswers.push(false);
      }
      return sendRerender(appState);
    }
    case "BeginQuizClicked": {
      appState.quizState = { kind: "ChoosingATopic" };
      return sendRerender(appState);
    }
    case "SelectedATopic": {
      const claims = makeClaims(data.topic);

      appState.quizState = {
        kind: "QuizIntro",
        topic: data.topic,
        claims: claims,
      };
      return sendRerender(appState);
    }
    case "ContinueButtonClicked": {
      switch (appState.quizState.kind) {
        case "LoadedPage":
        case "ChoosingATopic": {
          break;
        }
        case "QuizIntro": {
          appState.quizState = {
            kind: "InQuiz",
            topic: appState.quizState.topic,
            claims: appState.quizState.claims,
            questionIndex: 0,
            previousAnswers: [],
          };
          break;
        }
        case "InQuiz": {
          appState.quizState.questionIndex++;
          if (
            appState.quizState.questionIndex ===
            appState.quizState.claims.length
          ) {
            appState.quizState = {
              kind: "QuizOver",
              topic: appState.quizState.topic,
              claims: appState.quizState.claims,
              answers: appState.quizState.previousAnswers,
            };
          } else {
            appState.quizState.previousAnswers.push(data.answer);
          }
          break;
        }
        case "QuizOver": {
          break;
        }
      }

      return sendRerender(appState);
    }
    case "AddOpenGraphData": {
      appState.claimsOpenGraphData[data.claim.claim_text.join(" ")] =
        data.openGraphData;

      return dontRerender(appState);
    }
    case "Restart": {
      appState.quizState = { kind: "LoadedPage" };
      return sendRerender(appState);
    }
  }
}

renderChannel.channel.addEventListener("message", update);

export function startStore(): void {
  return;
}
