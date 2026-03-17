import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { productDTO } from './dto/product-dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('/add')
  @UseGuards(JwtAuthGuard)
  async create(@Body() createProductDto: productDTO.createProduct, @Req() req) {
    const token = req.headers.authorization;

    return await this.productsService.create(createProductDto, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Get('find')
  async findOne(@Query('id') id: number, @Query('name')name: string) {
    if(id != null) return await this.productsService.findById(id);
    else if (name != null) return await this.productsService.findByName(name);
    else return await this.productsService.findAll();
  }

  @Get('find/all')
  async findAll() {
    return this.productsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: productDTO.updateProduct, @Req() req) {
    return await this.productsService.update(+id, updateProductDto, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    console.log(req.user);
    return await this.productsService.remove(+id, req.user.role);
  }
}
