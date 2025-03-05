import { ClaimReviewRaw } from "./factOrFiction";

export type ClaimLabel =
  | "check_me"
  | "credible"
  | "mostly_credible"
  | "not_credible"
  | "not_verifiable"
  | "uncertain";

export type OpenGraph = {
  title?: string;
  image_url?: string;
  image_width?: number;
  image_height?: number;
  description?: string;
};

export type ClaimsOpenGraphDatabase = Record<string, OpenGraph>;
type FetchedClaims = {
  credible: ClaimReviewRaw[];
  notCredible: ClaimReviewRaw[];
};
export type Result =
  | { kind: "Error"; message: string }
  | { kind: "Success"; value: FetchedClaims };
