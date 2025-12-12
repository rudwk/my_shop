import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException, HttpStatus, Query, NotFoundException, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { userDTO } from './dto/userDto';
import { JwtAuthGuard } from 'src/auth/guard/auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/signup')
  async signup(@Body() userDTO: userDTO.SignUp) {
    await this.userService.signup(userDTO);

    return {
      status: HttpStatus.CREATED,
      message: "성공적으로 회원가입되었습니다"
    };
  }

  @Post('/signin')
  async signin(@Body() userDTO: userDTO.SignIn) {
    return this.userService.signin(userDTO);
  }

  @Get('/find')
  async findBy(@Query('id')id: number, @Query('email')email: string, @Query('name')name: string){
    let user;
    if(id != null) { user = await this.userService.findById(id); }
    else if (email != null) { user = await this.userService.findByEmail(email); }
    else if (name != null)  { user = await this.userService.findByName(name); }
    else { user = await this.userService.findAll();}

    if(!user) { throw new NotFoundException("해당 유저를 찾을 수 없습니다."); }
    else { return user; }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id')id: number, @Body()updateDto: userDTO.update){
    return this.userService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id')id: number){
    await this.userService.delete(id);

    return {
      status: 204,
      message: "성공적으로 회원탈퇴하였습니다."
    }
  }
}
