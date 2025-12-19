import { PartialType } from "@nestjs/mapped-types";
import { IsNumber, IsPositive, Min } from "class-validator";

export namespace CartDTO {
  export class cartAddDto {
    @IsNumber()
    productId: number;

    @IsNumber()
    @Min(1)
    @IsPositive()
    quantity: number;
  }

  export class quantityUpdateDto extends PartialType(cartAddDto){}
}