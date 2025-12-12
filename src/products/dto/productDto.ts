import { IsInt, IsString, Length } from "class-validator";

export namespace productDTO {
  export class createProduct {
    @IsString()
    @Length(1, 20)
    name: string;

    @IsString()
    description: string

    @IsInt()
    price: number;

    @IsInt()
    stock: number;
  }

  export class updateProduct {
    @IsString()
    name?: string;

    @IsString()
    description?: string;

    @IsInt()
    price?: number;

    @IsInt()
    stock?: number;
  }
}