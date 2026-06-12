import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: number, file: Express.Multer.File, uploader: string, milestoneIndex: number) {
    const base = process.env.PUBLIC_BASE_URL || 'http://localhost:4000';
    const uri = `${base}/uploads/${file.filename}`;
    return this.prisma.evidence.create({ data: { projectId, fileName: file.originalname, uri, uploader, milestoneIndex } });
  }
}
