import { PartialType } from "@nestjs/mapped-types";
import { IsInt, IsNotEmpty, IsString, Length } from "class-validator";
import { IsNull } from "typeorm";

export namespace productDTO {
  export class createProduct {
    @IsString()
    @Length(1, 20, {message: "이름은 1자 이상 20자 이하로 입력해주세요."})
    name: string;

    @IsString()
    description: string;

    @IsInt()
    price: number;

    @IsInt()
    stock: number;
  }

  export class updateProduct extends PartialType(createProduct){}
}