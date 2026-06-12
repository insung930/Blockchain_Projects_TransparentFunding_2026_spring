import { Body, Controller, Get, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ConnectWalletDto, DevLoginDto } from './dto';
import { JwtAuthGuard } from './jwt.guard';
import { CurrentUser } from './current-user.decorator';
import { JwtUser } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  google(@Res() res: Response) {
    return res.redirect(this.authService.googleAuthUrl());
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    const result = await this.authService.googleCallback(code);
    return res.redirect(this.authService.oauthRedirect(result.accessToken));
  }

  @Get('kakao')
  kakao(@Res() res: Response) {
    return res.redirect(this.authService.kakaoAuthUrl());
  }

  @Get('kakao/callback')
  async kakaoCallback(@Query('code') code: string, @Res() res: Response) {
    const result = await this.authService.kakaoCallback(code);
    return res.redirect(this.authService.oauthRedirect(result.accessToken));
  }

  @Post('dev-login')
  devLogin(@Body() body: DevLoginDto) {
    return this.authService.devLogin(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return this.authService.me(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('wallet')
  connectWallet(@CurrentUser() user: JwtUser, @Body() body: ConnectWalletDto) {
    return this.authService.connectWallet(user.id, body);
  }

  @Get('signer-address')
  signerAddress() {
    return { address: this.authService.signerAddress() };
  }
}
