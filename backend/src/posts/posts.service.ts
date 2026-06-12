import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProject(projectId: number) {
    return this.prisma.post.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' }, include: { user: true } });
  }

  async create(projectId: number, userId: number, body: CreatePostDto) {
    return this.prisma.post.create({ data: { projectId, userId, content: body.content }, include: { user: true } });
  }

  async update(id: number, userId: number, body: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (post.userId !== userId) throw new ForbiddenException('작성자만 수정할 수 있습니다.');
    return this.prisma.post.update({ where: { id }, data: { content: body.content }, include: { user: true } });
  }

  async remove(id: number, userId: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (post.userId !== userId) throw new ForbiddenException('작성자만 삭제할 수 있습니다.');
    return this.prisma.post.delete({ where: { id } });
  }
}
