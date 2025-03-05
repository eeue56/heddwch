import { Story } from "simple-link-aggregator/dist/story";
import { ClaimReviewRaw } from "./factOrFiction";

export type Update =
  | { kind: "Noop" }
  | { kind: "UpvoteClicked"; story: Story }
  | { kind: "DownvoteClicked"; story: Story }
  | { kind: "BeginQuizClicked" };

export type HeadlinesState =
  | { kind: "LoadedPage"; claims: ClaimReviewRaw[]; scores: number[] }
  | {
      kind: "Quiz";
      upvotedStories: Story[];
      downvotedStories: Story[];
      claims: ClaimReviewRaw[];
      scores: number[];
    };
