import { Injectable, NotFoundException } from '@nestjs/common';
import { productDTO } from './dto/product-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
      @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
    ){}

  async create(createProductDto: productDTO.createProduct) {
    const userEntity = this.productRepository.create(createProductDto);
    return this.productRepository.save(userEntity);
  }

  async findAll() {
    return this.productRepository.find()
  }

  async findById(id: number) {
    return this.productRepository.findOne({where: {id}})
  }

  async findByName(name: string) {
    return this.productRepository.find({where: {name}})
  }

  async update(id: number, updateProductDto: productDTO.updateProduct) {
    const product = this.productRepository.find({where: {id}})
    if(product == null) { throw new NotFoundException('해당 상품을 찾지 못했습니다'); }
    
    this.productRepository.update(id, updateProductDto);

    return {
      status:200,
      message: "성공적으로 수정되었습니다"
    }
  }

  async remove(id: number) {
    const product = await this.findById(id);
    if(product == null) throw new NotFoundException('해당 상품을 찾을 수 없습니다.')

    this.productRepository.delete(id);

    return {
      status: 200,
      message: `성공적으로 상품을 제거했습니다`
    }
  }
}
