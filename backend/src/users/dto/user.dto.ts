import { IsEmail,IsNotEmpty,IsOptional,IsString ,Length} from "class-validator";
import { PartialType } from '@nestjs/mapped-types';

export namespace userDTO {
  export class SignUp {
    @IsEmail({}, { message: "이메일을 입력해주십시오"})
    email: string;

    @IsString()
    @Length(4, 20, { message: "비밀번호는 4자 이상 20자 이하로 입력해주십시오" })
    password: string;

    @IsString({message: "이름을 입력해주십시오"})
    name: string;

    @IsString()
    address: string
  }
  
  export class SignIn {
    @IsEmail({}, { message: "이메일을 입력해주십시오" })
    email: string;

    @IsString()
    @Length(4, 20, { message: "비밀번호는 4자 이상 20자 이하로 입력해주십시오" })
    password: string;
  }

  export class update {
    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    address?: string;
  }
}