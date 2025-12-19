import { ConflictException, ForbiddenException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { userDTO } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { UserResponseDto } from './dto/user-response.dto';
require('dotenv').config();

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ){}

  //회원가입
  async signup(userDTO: userDTO.SignUp){
    const { email } = userDTO;

    const hasEmail = await this.findByEmail(email);

    if (hasEmail) {
      throw new ConflictException('이미 사용중인 이메일 입니다.');
    }
    const userEntity = this.userRepository.create(userDTO);
    await this.userRepository.save(userEntity);

    return this.createToken(userEntity.id, userEntity.role);
  }

  
  //로그인
  async signin(userDTO: userDTO.SignIn){
    const { email, password } = userDTO;
    const user = await this.findByEmail(email);
    if(user == null) { throw new UnauthorizedException('이메일 또는 아이디를 확인해주세요'); }

    const isSamePassword = bcrypt.compare(password, user.password);
    if(isSamePassword == null) { throw new UnauthorizedException('이메일 또는 아이디를 확인해주세요'); }

    const {accsessToken, refreshToken} = await this.createToken(user.id, user.role);

    return {
      status: HttpStatus.OK,
      message: "성공적으로 로그인되었습니다.",
      accsessToken: accsessToken,
      refreshToken: refreshToken
    }
  }

  async createToken(id:number, role:string){
    const payload = {
      id: id,
      role: role
    }

    const accsessToken = this.jwtService.sign(payload, {secret: process.env.JWT_SECRET_ACCESS, expiresIn: '3h'});
    const refreshToken = this.jwtService.sign(payload, {secret: process.env.JWT_SECRET_REFRESH, expiresIn: '7d'});

    return {accsessToken, refreshToken}
  }

  //회원 조회
  async findById(id: number){
    const user = await this.userRepository.findOne({where: {id: id}});
    if(!user) { throw new NotFoundException("해당 유저를 찾을 수 없습니다.")}
    return user;
  }

  findByEmail(email: string){
    return this.userRepository.findOne({where: {email:  email}});
  }
  
  findByName(name: string){
    return this.userRepository.find({where: {name: name}});
  }
  
  findAll(){
    return this.userRepository.find();
  }

  async hasUser(id: number) {
    const user = await this.userRepository.findOne({where: {id}});
    if(user == null) {
      return true;
    }else{
      return false;
    }
  }

  // 회원 정보 수정
  async update(userId: number,updateDto: userDTO.update, user: User ) {
    if(await this.hasUser(userId)){
      throw new NotFoundException("해당 유저를 찾을 수 없습니다.");
    }

    if(user.id != userId && user.role != "ADMIN") {
      throw new UnauthorizedException("해당 유저를 수정할 권한이 없습니다");
    }

    this.userRepository.update(userId, updateDto);
    return {
      message: "성공적으로 수정되었습니다"
    }
  }

  //회원 탈퇴
  async delete(userId: number, user: User){
    if(await this.hasUser(userId)){
      throw new NotFoundException("해당 유저를 찾을 수 없습니다.");
    }

    if(user.id != userId && user.role != "ADMIN") {
      throw new ForbiddenException("해당 유저를 수정할 권한이 없습니다");
    }

    this.userRepository.delete(userId);
    return {
      message: "성공적으로 탈퇴하였습니다."
    };
  }
}
