import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { productDTO } from './dto/productDto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: productDTO.createProduct) {
    this.productsService.create(createProductDto);

    return {
      status: 201,
      message: "성공적으로 등록하였습니다"
    }
  }

  @Get('find/')
  findOne(@Query('id') id: number, @Query('name')name: string) {
    if(id != null) return this.productsService.findById(id);
    else if (name != null) return this.productsService.findByName(name);
    else return this.productsService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: productDTO.updateProduct) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
