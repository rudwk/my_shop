import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService
  ){}

  async createToken(id:number, role:string){
    const payload = {
      id: id,
      role: role
    }

    const accsessToken = this.jwtService.sign(payload, {secret: process.env.JWT_SECRET_ACCSESS, expiresIn: '300s'});
    const refreshToken = this.jwtService.sign(payload, {secret: process.env.JWT_SECRET_REFRESH, expiresIn: '7d'});

    return {accsessToken, refreshToken}
  }
}
