import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as jwt from 'jsonwebtoken';
import { Wallet } from 'ethers';
import axios from 'axios';
import { ConnectWalletDto, DevLoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  googleAuthUrl() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback';
    if (!clientId) throw new BadRequestException('GOOGLE_CLIENT_ID가 설정되지 않았습니다.');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account'
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async googleCallback(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback';
    if (!clientId || !clientSecret) throw new BadRequestException('Google OAuth 환경변수가 설정되지 않았습니다.');

    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
    });

    const profile = userRes.data;
    const user = await this.prisma.user.upsert({
      where: { provider_providerId: { provider: 'google', providerId: String(profile.id) } },
      update: { email: profile.email, name: profile.name || profile.email, avatarUrl: profile.picture },
      create: { provider: 'google', providerId: String(profile.id), email: profile.email, name: profile.name || profile.email, avatarUrl: profile.picture }
    });
    return { user, accessToken: this.sign(user) };
  }

  kakaoAuthUrl() {
    const clientId = process.env.KAKAO_CLIENT_ID;
    const redirectUri = process.env.KAKAO_CALLBACK_URL || 'http://localhost:4000/auth/kakao/callback';
    if (!clientId) throw new BadRequestException('KAKAO_CLIENT_ID가 설정되지 않았습니다.');
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code' });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  async kakaoCallback(code: string) {
    const clientId = process.env.KAKAO_CLIENT_ID;
    const clientSecret = process.env.KAKAO_CLIENT_SECRET || '';
    const redirectUri = process.env.KAKAO_CALLBACK_URL || 'http://localhost:4000/auth/kakao/callback';
    if (!clientId) throw new BadRequestException('Kakao OAuth 환경변수가 설정되지 않았습니다.');

    const body: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code
    };
    if (clientSecret) body.client_secret = clientSecret;

    const tokenRes = await axios.post('https://kauth.kakao.com/oauth/token', new URLSearchParams(body).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }
    });

    const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
    });

    const profile = userRes.data;
    const account = profile.kakao_account || {};
    const kakaoProfile = account.profile || {};
    const user = await this.prisma.user.upsert({
      where: { provider_providerId: { provider: 'kakao', providerId: String(profile.id) } },
      update: { email: account.email, name: kakaoProfile.nickname || account.email || `kakao-${profile.id}`, avatarUrl: kakaoProfile.profile_image_url },
      create: { provider: 'kakao', providerId: String(profile.id), email: account.email, name: kakaoProfile.nickname || account.email || `kakao-${profile.id}`, avatarUrl: kakaoProfile.profile_image_url }
    });
    return { user, accessToken: this.sign(user) };
  }

  async devLogin(body: DevLoginDto) {
    if (process.env.OAUTH_ALLOW_DEV_LOGIN !== 'true') {
      throw new BadRequestException('개발 로그인은 비활성화되어 있습니다. 실제 OAuth 로그인을 사용하세요.');
    }
    const providerId = body.providerId || body.email || `${body.provider}:${body.name}`;
    const user = await this.prisma.user.upsert({
      where: { provider_providerId: { provider: body.provider, providerId } },
      update: { email: body.email, name: body.name, avatarUrl: body.avatarUrl },
      create: { provider: body.provider, providerId, email: body.email, name: body.name, avatarUrl: body.avatarUrl }
    });
    return { user, accessToken: this.sign(user) };
  }

  async me(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async connectWallet(userId: number, body: ConnectWalletDto) {
    const walletAddress = body.walletAddress.toLowerCase();
    const exists = await this.prisma.user.findFirst({ where: { walletAddress, id: { not: userId } } });
    if (exists) throw new BadRequestException('이미 다른 회원에게 연결된 지갑입니다.');
    const user = await this.prisma.user.update({ where: { id: userId }, data: { walletAddress } });
    return { user, accessToken: this.sign(user) };
  }

  signerAddress() {
    const pk = process.env.AUTH_SIGNER_PRIVATE_KEY || '0x8b3a350cf5c34c9194ca3a545d03bb755eedc292b4d697b91c4f9e8fced97e2a';
    return new Wallet(pk).address;
  }

  oauthRedirect(accessToken: string) {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${frontend}/auth/callback?token=${encodeURIComponent(accessToken)}`;
  }

  private sign(user: any) {
    return jwt.sign(
      { id: user.id, provider: user.provider, providerId: user.providerId, email: user.email, name: user.name, walletAddress: user.walletAddress },
      process.env.JWT_SECRET || 'local-dev-jwt-secret-change-me',
      { expiresIn: '7d' }
    );
  }
}
