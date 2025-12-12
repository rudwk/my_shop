import { Injectable, NotFoundException } from '@nestjs/common';
import { productDTO } from './dto/productDto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
      @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
    ){}

  create(createProductDto: productDTO.createProduct) {
    const userEntity = this.productRepository.create(createProductDto);
    return this.productRepository.save(userEntity);
  }

  findAll() {
    return this.productRepository.find()
  }

  findById(id: number) {
    return this.productRepository.find({where: {id}})
  }

  findByName(name: string) {
    return this.productRepository.find({where: {name}})
  }

  update(id: number, updateProductDto: productDTO.updateProduct) {
    const product = this.productRepository.find({where: {id}})
    if(product == null) { throw new NotFoundException('해당 상품을 찾지 못했습니다'); }
    
    return this.productRepository.update(id, updateProductDto);
  }

  remove(id: number) {
    const product = this.productRepository.find({where: {id}});
  }
}
