import { ClaimReviewRaw, Topic } from "../types/factOrFiction";
import { HeadlinesState, Update } from "../types/headlines";
import { Result } from "../types/shared";
import { doNotRerender, requestRerender, UpdateResponse } from "../types/store";

export async function fetchClaims(topic: Topic): Promise<Result> {
  const results = await Promise.allSettled([
    fetch("/data/headlines_credible.json").then((res) => res.json()),
    fetch("/data/headlines_not_credible.json").then((res) => res.json()),
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
      `Failed to fetch '/data/headlines_credible.json' due to ${maybeCredible.reason}`
    );
  }

  if (maybeNotCredible.status === "rejected") {
    errorMessage.push(
      `Failed to fetch '/data/headlines_not_credible.json' due to ${maybeNotCredible.reason}`
    );
  }

  return { kind: "Error", message: errorMessage.join("\n") };
}

export function makeClaims(
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

export async function updateHeadlines(
  message: Update,
  appState: HeadlinesState
): UpdateResponse<HeadlinesState> {
  switch (message.kind) {
    case "Noop": {
      return doNotRerender(appState);
    }
    case "UpvoteClicked": {
      if (appState.kind === "Quiz") {
        appState.upvotedStories.push(message.story);
        history.replaceState(appState, "");
      }
      return requestRerender(appState);
    }
    case "DownvoteClicked": {
      if (appState.kind === "Quiz") {
        appState.downvotedStories.push(message.story);
        history.replaceState(appState, "");
      }
      return requestRerender(appState);
    }
    case "BeginQuizClicked": {
      appState = {
        kind: "Quiz",
        claims: appState.claims,
        scores: appState.scores,
        upvotedStories: [],
        downvotedStories: [],
      };
      history.pushState(appState, "");
      return requestRerender(appState);
    }
  }
}
