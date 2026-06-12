import { Body, Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { EvidenceService } from './evidence.service';

const uploadDir = join(process.cwd(), 'uploads');
const storage = diskStorage({
  destination: (_req, _file, cb) => { mkdirSync(uploadDir, { recursive: true }); cb(null, uploadDir); },
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`)
});

@Controller('projects/:projectId/evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 20 * 1024 * 1024 } }))
  upload(@Param('projectId') projectId: string, @UploadedFile() file: Express.Multer.File, @Body('uploader') uploader: string, @Body('milestoneIndex') milestoneIndex: string) {
    return this.evidenceService.create(Number(projectId), file, uploader, Number(milestoneIndex));
  }
}
