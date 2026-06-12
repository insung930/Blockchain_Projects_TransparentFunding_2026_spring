import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/types';

@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('projects/:projectId/posts')
  findByProject(@Param('projectId') projectId: string) { return this.postsService.findByProject(Number(projectId)); }

  @UseGuards(JwtAuthGuard)
  @Post('projects/:projectId/posts')
  create(@Param('projectId') projectId: string, @Body() body: CreatePostDto, @CurrentUser() user: JwtUser) {
    return this.postsService.create(Number(projectId), user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('posts/:id')
  update(@Param('id') id: string, @Body() body: UpdatePostDto, @CurrentUser() user: JwtUser) {
    return this.postsService.update(Number(id), user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('posts/:id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.postsService.remove(Number(id), user.id);
  }
}
