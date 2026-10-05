export type CreatorVideoInput = {
  creatorName: string;
  handle?: string | null;
  instagramUrl?: string | null;
  videoUrl: string;
  posterUrl?: string | null;
  isVisible?: boolean;
  sortOrder?: number | string;
};
