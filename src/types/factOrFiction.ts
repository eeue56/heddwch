import { ClaimLabel } from "./shared";
import { SocialMediaClaimReview } from "./socialMediaPostReviewer";

export const TOPICS = ["Norway", "USA", "UK", "Sweden"] as const;

export type Topic = (typeof TOPICS)[number];

export type ClaimReviewRaw = {
  label: ClaimLabel;
  claim_text: string[];
  appearances: string[];
  reviews: Review[];
  review_url: string;
  fact_checker: FactChecker;
};

type FactChecker = {
  country: string;
};

type Review = {
  original_label: string;
  date_published: string;
};

export type Update =
  | { kind: "SelectedATopic"; topic: Topic }
  | { kind: "BeginQuizClicked" }
  | { kind: "ClickedTrue"; claim: SocialMediaClaimReview }
  | { kind: "ClickedFalse"; claim: SocialMediaClaimReview }
  | { kind: "ContinueButtonClicked"; answer: boolean }
  | { kind: "Restart" };

export type FactOrFictionState =
  | { kind: "LoadedPage" }
  | { kind: "ChoosingATopic" }
  | { kind: "QuizIntro"; topic: Topic; claims: ClaimReviewRaw[] }
  | {
      kind: "InQuiz";
      topic: Topic;
      claims: ClaimReviewRaw[];
      previousAnswers: boolean[];
      questionIndex: number;
    }
  | {
      kind: "QuizOver";
      topic: Topic;
      claims: ClaimReviewRaw[];
      answers: boolean[];
    };
