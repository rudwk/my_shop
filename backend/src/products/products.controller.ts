import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { productDTO } from './dto/product-dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { CurrentUser } from 'src/auth/common/user.decorator';

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
  findOne(@Query('id') id: number, @Query('name')name: string) {
    if(id != null) return this.productsService.findById(id);
    else if (name != null) return this.productsService.findByName(name);
    else return this.productsService.findAll();
  }

  @Get('find/all')
  findAll() {
    return this.productsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: productDTO.updateProduct, @Req() req) {
    return this.productsService.update(+id, updateProductDto, req.user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.productsService.remove(+id, req.user.role);
  }
}
