import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new UnauthorizedException('로그인이 필요합니다.');
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'local-dev-jwt-secret-change-me');
      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 로그인 토큰입니다.');
    }
  }
}
