import { BadRequestException } from "@nestjs/common";
import { PartialType } from "@nestjs/mapped-types";
import { IsInt, IsNotEmpty, IsString, Length } from "class-validator";
import { IsNull } from "typeorm";

export namespace productDTO {
  export class createProduct {
    name: string;

    description: string;

    price: number;

    stock: number;
  }

  export class updateProduct extends PartialType(createProduct){}
}