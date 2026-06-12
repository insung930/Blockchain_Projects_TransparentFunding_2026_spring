import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { PostsController } from './posts/posts.controller';
import { PostsService } from './posts/posts.service';
import { EvidenceController } from './evidence/evidence.controller';
import { EvidenceService } from './evidence/evidence.service';
import { PledgesController } from './pledges/pledges.controller';
import { PledgesService } from './pledges/pledges.service';
import { BlockchainSyncService } from './sync/blockchain-sync.service';

@Module({
  imports: [ScheduleModule.forRoot(), ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }])],
  controllers: [AuthController, ProjectsController, PostsController, EvidenceController, PledgesController],
  providers: [PrismaService, AuthService, ProjectsService, PostsService, EvidenceService, PledgesService, BlockchainSyncService]
})
export class AppModule {}
