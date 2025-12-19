import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { productDTO } from './dto/product-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
      @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
    ){}

  create(createProductDto: productDTO.createProduct) {
    try {
      const userEntity = this.productRepository.create(createProductDto);
      this.productRepository.save(userEntity);
    }catch(e) {
      return new e;
    }

    return {
      "message": "성공적으로 등록하였습니다"
    }
  }

  findAll() {
    return this.productRepository.find()
  }

  async findById(id: number) {
    const product = await this.productRepository.findOne({where: {id}})
    if(product == null) { throw new NotFoundException("해당 상품을 찾을 수 없습니다.");}
    return product;
  }

  async findByIds(ids: number[]) {
    return await this.productRepository.find({
      where: { id: In(ids) },
    });
  }

  findByName(name: string) {
    return this.productRepository.find({where: {name}})
  }

  async hasProduct(id) {
    const product = await this.productRepository.findOne({where: {id}})
    if(product == null) { return true; }
    else { return false; }
  }

  async update(productId: number, updateProductDto: productDTO.updateProduct, role?) {
    const product = await this.findById(productId);
    if(!product){
      throw new NotFoundException('해당 상품을 찾지 못했습니다');
    }
    
    this.productRepository.update(productId, updateProductDto);

    return {
      status:200,
      message: "성공적으로 수정되었습니다"
    }
  }

  async remove(id: number) {
    const result = await this.productRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('해당 상품을 찾지 못했습니다');
    }

    return {
      status: 200,
      message: '성공적으로 제거되었습니다',
    };
  }
}
