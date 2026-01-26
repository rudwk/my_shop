import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis,
  ){}

  async generateAccsessToken(refreshToken: string) {
    let payload;
    try {
      payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    } catch (e) {
      throw new NotFoundException('만료된 refresh 토큰입니다');
    }
    const storedToken = await this.redis.get(`refresh:${payload.sub}`);
    
    if (storedToken !== refreshToken) {
      throw new UnauthorizedException('탈취된 refresh token');
    }

    const newAccsess = this.jwtService.sign({ sub: payload.sub, nickname: payload.nickname }, { secret: process.env.JWT_ACCSESS_SECRET, expiresIn: '30m' });
    return { accsessToken: newAccsess };
  }
}
