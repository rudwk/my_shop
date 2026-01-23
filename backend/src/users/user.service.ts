import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { userDTO } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

//회원가입
  async signup(dto: userDTO.SignUp) {
    const { email, password } = dto;

    const exists = await this.userRepository.findOne({
      where: { email },
    });

    if (exists) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(password+process.env.HASH_SALT, 10);

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    try {
      await this.userRepository.save(user);
    } catch {
      throw new InternalServerErrorException('회원가입 실패');
    }

    return this.createToken(user.id, user.role);
  }

//로그인
  async signin(dto: userDTO.SignIn) {
    const { email, password } = dto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isMatch = await bcrypt.compare(password+process.env.HASH_SALT, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const tokens = await this.createToken(user.id, user.role);

    return {
      status: HttpStatus.OK,
      message: '성공적으로 로그인되었습니다.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

//토큰 생성
  async createToken(userId: number, role: string) {
    const payload = {
      sub: userId,
      role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_ACCESS,
      expiresIn: '3h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_REFRESH,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

//유저 조회
  async findById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('해당 유저를 찾을 수 없습니다.');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByName(name: string) {
    return this.userRepository.find({
      where: { name },
    });
  }

  async findAll() {
    return this.userRepository.find();
  }

//유저 존재 여부 확인
  async exists(id: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    return !!user;
  }

  //회원 정보 수정
  async update(
    targetUserId: number,
    updateDto: userDTO.update,
    requester: User,
  ) {
    const exists = await this.exists(targetUserId);
    if (!exists) {
      throw new NotFoundException('해당 유저를 찾을 수 없습니다.');
    }

    if (
      requester.id !== targetUserId &&
      requester.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('수정 권한이 없습니다.');
    }

    if (updateDto.password) {
      updateDto.password = await bcrypt.hash(updateDto.password, 10);
    }

    const result = await this.userRepository.update(
      targetUserId,
      updateDto,
    );

    if (result.affected === 0) {
      throw new InternalServerErrorException('회원 정보 수정 실패');
    }

    return {
      message: '성공적으로 수정되었습니다.',
    };
  }

  //회원 탈퇴

  async delete(targetUserId: number, requester: User) {
    const exists = await this.exists(targetUserId);
    if (!exists) {
      throw new NotFoundException('해당 유저를 찾을 수 없습니다.');
    }

    if (
      requester.id !== targetUserId &&
      requester.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }

    const result = await this.userRepository.delete(targetUserId);

    if (result.affected === 0) {
      throw new InternalServerErrorException('회원 삭제 실패');
    }

    return {
      message: '성공적으로 탈퇴하였습니다.',
    };
  }
}
