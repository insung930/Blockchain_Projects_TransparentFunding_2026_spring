import { Body, Controller, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { ProjectsService } from './projects.service';
import { AttachContractDto, CreateProjectDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/types';

const uploadDir = join(process.cwd(), 'uploads');
const storage = diskStorage({
  destination: (_req, _file, cb) => { mkdirSync(uploadDir, { recursive: true }); cb(null, uploadDir); },
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`)
});

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image', { storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, /^image\//.test(file.mimetype)) }))
  create(@Body() body: CreateProjectDto, @CurrentUser() user: JwtUser, @UploadedFile() file?: Express.Multer.File) {
    return this.projectsService.create(body, user.id, file ? `/uploads/${file.filename}` : undefined);
  }

  @Get()
  findAll() { return this.projectsService.findAll(); }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: JwtUser) { return this.projectsService.findMine(user.id); }

  @UseGuards(JwtAuthGuard)
  @Get('mine/:id')
  findMineOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.projectsService.findMineOne(Number(id), user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.projectsService.findPublicOne(Number(id)); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/contract')
  attachContract(@Param('id') id: string, @Body() body: AttachContractDto, @CurrentUser() user: JwtUser) {
    return this.projectsService.attachContract(Number(id), user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/early-close')
  markEarlyClosed(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.projectsService.markEarlyClosed(Number(id), user.id);
  }
}
