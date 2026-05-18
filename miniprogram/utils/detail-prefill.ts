export interface PetSocialDetailPrefill {
  id: string;
  title: string;
  summary: string;
  image: string;
  authorName: string;
  authorAvatarUrl?: string;
  favoriteCount: number;
  favorited: boolean;
  isServiceDetail?: boolean;
  badge?: string;
  serviceFields?: Array<{ label: string; value: string }>;
  serviceDescription?: string;
  phoneAuthorized?: boolean;
}

let petSocialDetailPrefill: PetSocialDetailPrefill | null = null;

export function setPetSocialDetailPrefill(prefill: PetSocialDetailPrefill) {
  petSocialDetailPrefill = prefill;
}

export function consumePetSocialDetailPrefill(postId: string) {
  if (!petSocialDetailPrefill || petSocialDetailPrefill.id !== postId) {
    return null;
  }

  const prefill = petSocialDetailPrefill;
  petSocialDetailPrefill = null;
  return prefill;
}
