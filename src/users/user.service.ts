import { ConflictException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { userDTO } from './dto/user-dto';
import * as bcrypt from 'bcrypt';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService
  ){}

  //회원가입
  async signup(userDTO: userDTO.SignUp){
    const { email } = userDTO;

    const hasEmail = await this.findByEmail(email);

    if (hasEmail) {
      throw new ConflictException('이미 사용중인 이메일 입니다.');
    }
    const userEntity = this.userRepository.create(userDTO);
    return await this.userRepository.save(userEntity);
  }

  
  //로그인
  async signin(userDTO: userDTO.SignIn){
    const { email, password } = userDTO;
    const user = await this.findByEmail(email);
    if(user == null) { throw new UnauthorizedException('이메일 또는 아이디를 확인해주세요'); }

    const isSamePassword = bcrypt.compare(password, user.password);
    if(isSamePassword == null) { throw new UnauthorizedException('이메일 또는 아이디를 확인해주세요'); }

    const {accsessToken, refreshToken} = await this.authService.createToken(user.id, user.role);

    return {
      status: HttpStatus.OK,
      message: "성공적으로 로그인되었습니다.",
      accsessToken: accsessToken,
      refreshToken: refreshToken
    }
  }

  //회원 조회
  findById(id: number){
    const user = this.userRepository.findOne({where: {id}});
    return this.isUser(user);
  }

  findByEmail(email: string){
    const user = this.userRepository.findOne({where: {email}});
    return this.isUser(user);
  }
  
  findByName(name: string){
    const user = this.userRepository.find({where: {name: name}});
  }
  
  findAll(){
    return this.userRepository.find();
  }

  isUser(user: Promise<User>) {
    if(!user) {throw new NotFoundException("해당 유저를 찾을 수 없습니다."); }
    else { return user; }
  }

  // 회원 정보 수정
  update(id: number,updateDto: userDTO.update ) {
    const user = this.findById(id);
    if(user == null) { throw new NotFoundException("해당 유저를 찾을 수 없습니다."); }

    try{
      this.userRepository.update(id, updateDto);
      return {
        status: 200,
        message: "성공적으로 수정되었습니다"
      }
    } catch(e) {
      throw new e;
    }
  }

  //회원 탈퇴
  delete(id){
    return this.userRepository.delete(id);
  }
}
