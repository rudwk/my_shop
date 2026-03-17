import { PartialType } from "@nestjs/mapped-types";
import { IsNumber, IsPositive, Min } from "class-validator";
import { Product } from "src/products/entities/product.entity";

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

  export class cartResponseDto {
    cartItemId: number;
    quantity: number;
    product: Product;
  }
}