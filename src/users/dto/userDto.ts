import { IsEmail,IsNotEmpty,IsString ,Length} from "class-validator";
import { PartialType } from '@nestjs/mapped-types';

export namespace userDTO {
  export class SignUp {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @Length(4, 20)
    password: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    address: string
  }
  
  export class SignIn {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @Length(4, 20)
    password: string;
  }

  export class update extends PartialType(SignUp){}
}