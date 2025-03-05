import { ClaimLabel } from "./shared";

export type SocialMediaClaimReview = {
  label: ClaimLabel;
  text: string;
};

export type Update = { kind: "Noop" };
