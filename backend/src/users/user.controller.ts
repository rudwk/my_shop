import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException, HttpStatus, Query, NotFoundException, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { userDTO } from './dto/user.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/signup')
  async signup(@Body() userDTO: userDTO.SignUp) {
    return await this.userService.signup(userDTO);
  }

  @Post('/signin')
  async signin(@Body() userDTO: userDTO.SignIn) {
    return this.userService.signin(userDTO);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/find')
  async findBy(@Query('id')id: number, @Query('email')email: string, @Query('name')name: string){
    if(id != null) { return new UserResponseDto(await this.userService.findById(id)); }
    else if (email != null) { return new UserResponseDto(await this.userService.findByEmail(email)); }
    else if (name != null)  { 
      const users = await this.userService.findByName(name); 
      return users.map(user => new UserResponseDto(user))
    }
  }

  @Get('/find/all')
  async findAll() {
    const users = await this.userService.findAll();
    return users.map(user => new UserResponseDto(user))
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Req() req, @Param("id")userId, @Body()updateDto: userDTO.update){
    return this.userService.update(userId, updateDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id')id: number, @Req() req){
    return this.userService.delete(id, req.user);
  }
}
