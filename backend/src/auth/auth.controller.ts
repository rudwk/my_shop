import { Body, Controller, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/refresh')
  authenticateUser(@Body('refreshToken') refreshToken: string) {
    return this.authService.generateAccsessToken(refreshToken);
  }
}
