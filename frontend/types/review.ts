export type ReviewInput = {
  name: string;
  text: string;
  rating: number | string;
  image?: string | null;
  source?: string | null;
  isVisible?: boolean;
  sortOrder?: number | string;
};
