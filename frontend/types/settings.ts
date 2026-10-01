// Contact links and store controls, as plain data that can cross from server
// to client components. Mirrors the SiteSettings row minus id and updatedAt.
export type SiteSettingsData = {
  whatsappNumber: string | null;
  phoneNumber: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  deliveryFee: number;
  hoursText: string;
  openTime: string | null;
  closeTime: string | null;
  autoSchedule: boolean;
  isOpen: boolean;
  closedMessage: string;
};

export type SiteSettingsInput = {
  whatsappNumber?: string | null;
  phoneNumber?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  deliveryFee?: number | string;
  hoursText?: string;
  openTime?: string | null;
  closeTime?: string | null;
  autoSchedule?: boolean;
  isOpen?: boolean;
  closedMessage?: string;
};
