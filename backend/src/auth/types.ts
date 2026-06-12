export type JwtUser = {
  id: number;
  provider: string;
  providerId: string;
  email?: string | null;
  name: string;
  walletAddress?: string | null;
};
