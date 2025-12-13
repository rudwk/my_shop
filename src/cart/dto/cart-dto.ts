import { IsNumber, IsPositive, Min } from "class-validator";

export class CartAddDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(1)
  @IsPositive()
  quantity: number;
}