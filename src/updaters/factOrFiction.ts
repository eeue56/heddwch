import {
  ClaimReviewRaw,
  FactOrFictionState,
  Topic,
  Update,
} from "../types/factOrFiction";
import { Result } from "../types/shared";
import { doNotRerender, requestRerender, UpdateResponse } from "../types/store";

export function initialState(): FactOrFictionState {
  return {
    kind: "LoadedPage",
  };
}

type DataUrlPair = {
  credible: string;
  notCredible: string;
};

const DATA_URLS: Record<Topic, DataUrlPair> = {
  Norway: {
    credible: "/data/norwegian_credible.json",
    notCredible: "/data/norwegian_not_credible.json",
  },
  Sweden: {
    credible: "/data/sweden_credible.json",
    notCredible: "/data/sweden_not_credible.json",
  },
  UK: {
    credible: "/data/uk_credible.json",
    notCredible: "/data/uk_not_credible.json",
  },
  USA: {
    credible: "/data/usa_credible.json",
    notCredible: "/data/usa_not_credible.json",
  },
};

export async function fetchClaims(topic: Topic): Promise<Result> {
  const results = await Promise.allSettled([
    fetch(DATA_URLS[topic].credible).then((res) => res.json()),
    fetch(DATA_URLS[topic].notCredible).then((res) => res.json()),
  ]);

  const maybeCredible = results[0];
  const maybeNotCredible = results[1];

  if (
    maybeCredible.status === "fulfilled" &&
    maybeNotCredible.status === "fulfilled"
  ) {
    return {
      kind: "Success",
      value: {
        credible: maybeCredible.value,
        notCredible: maybeNotCredible.value,
      },
    };
  }

  const errorMessage: string[] = [];

  if (maybeCredible.status === "rejected") {
    errorMessage.push(
      `Failed to fetch ${DATA_URLS[topic].credible} due to ${maybeCredible.reason}`
    );
  }

  if (maybeNotCredible.status === "rejected") {
    errorMessage.push(
      `Failed to fetch ${DATA_URLS[topic].notCredible} due to ${maybeNotCredible.reason}`
    );
  }

  return { kind: "Error", message: errorMessage.join("\n") };
}

function makeClaims(
  topic: Topic,
  credibleClaims: ClaimReviewRaw[],
  notCredibleClaims: ClaimReviewRaw[]
): ClaimReviewRaw[] {
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

export async function updateFactOrFiction(
  message: Update,
  appState: FactOrFictionState
): UpdateResponse<FactOrFictionState> {
  switch (message.kind) {
    case "BeginQuizClicked": {
      appState = { kind: "ChoosingATopic" };
      return requestRerender(appState);
    }
    case "SelectedATopic": {
      const claimReviewsRaw = await fetchClaims(message.topic);
      if (claimReviewsRaw.kind === "Error") {
        console.error(claimReviewsRaw.message);
        return doNotRerender(appState);
      }

      const claims = makeClaims(
        message.topic,
        claimReviewsRaw.value.credible,
        claimReviewsRaw.value.notCredible
      );

      appState = {
        kind: "QuizIntro",
        topic: message.topic,
        claims: claims,
      };
      return requestRerender(appState);
    }
    case "ClickedTrue": {
      if (appState.kind === "InQuiz") {
        appState.previousAnswers.push(true);
      }
      return requestRerender(appState);
    }
    case "ClickedFalse": {
      if (appState.kind === "InQuiz") {
        appState.previousAnswers.push(false);
      }
      return requestRerender(appState);
    }
    case "ContinueButtonClicked": {
      switch (appState.kind) {
        case "LoadedPage":
        case "ChoosingATopic": {
          break;
        }
        case "QuizIntro": {
          appState = {
            kind: "InQuiz",
            topic: appState.topic,
            claims: appState.claims,
            questionIndex: 0,
            previousAnswers: [],
          };
          break;
        }
        case "InQuiz": {
          appState.questionIndex++;
          if (appState.questionIndex === appState.claims.length) {
            appState = {
              kind: "QuizOver",
              topic: appState.topic,
              claims: appState.claims,
              answers: appState.previousAnswers,
            };
          } else {
            appState.previousAnswers.push(message.answer);
          }
          break;
        }
        case "QuizOver": {
          break;
        }
      }

      return requestRerender(appState);
    }
    case "Restart": {
      appState = { kind: "LoadedPage" };
      return requestRerender(appState);
    }
  }
}
