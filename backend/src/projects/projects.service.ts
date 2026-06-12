import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AttachContractDto, CreateProjectDto } from './dto';

type MilestoneInput = { title: string; amountEth: string };
type PledgeOptionInput = { title: string; description?: string; amountEth: string };

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateProjectDto, userId: number, imageUrl?: string) {
    const milestones = this.parseArray<MilestoneInput>(body.milestones, 'milestones').filter((i) => i.title && i.amountEth);
    const pledgeOptions = this.parseArray<PledgeOptionInput>(body.pledgeOptions, 'pledgeOptions').filter((i) => i.title && i.amountEth);
    if (milestones.length === 0) throw new BadRequestException('마일스톤은 최소 1개 이상 필요합니다.');
    if (pledgeOptions.length === 0) throw new BadRequestException('후원 옵션은 최소 1개 이상 필요합니다.');
    for (const option of pledgeOptions) {
      const amount = Number(option.amountEth);
      if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('후원 옵션 금액은 0보다 커야 합니다.');
    }

    return this.prisma.project.create({
      data: {
        userId,
        title: body.title,
        description: body.description,
        imageUrl,
        creatorAddress: body.creatorAddress,
        goalEth: body.goalEth,
        chainId: Number(body.chainId || 31337),
        milestones: { create: milestones.map((m, index) => ({ title: String(m.title), amountEth: String(m.amountEth), sortOrder: index })) },
        pledgeOptions: { create: pledgeOptions.map((o, index) => ({ title: String(o.title), description: o.description ? String(o.description) : '', amountEth: String(o.amountEth), sortOrder: index })) }
      },
      include: this.includeAll()
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      where: { status: { not: 'DRAFT' }, contractAddress: { not: null } },
      orderBy: { createdAt: 'desc' },
      include: { milestones: { orderBy: { sortOrder: 'asc' } }, pledgeOptions: { orderBy: { sortOrder: 'asc' } } }
    });
  }

  async findMine(userId: number) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { milestones: { orderBy: { sortOrder: 'asc' } }, pledgeOptions: { orderBy: { sortOrder: 'asc' } } }
    });
  }

  async findPublicOne(id: number) {
    const project = await this.prisma.project.findUnique({ where: { id }, include: this.includeAll() });
    if (!project || project.status === 'DRAFT' || !project.contractAddress) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    return project;
  }

  async findMineOne(id: number, userId: number) {
    const project = await this.prisma.project.findUnique({ where: { id }, include: this.includeAll() });
    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    if (project.userId !== userId) throw new ForbiddenException('본인이 등록한 프로젝트만 조회할 수 있습니다.');
    return project;
  }

  async attachContract(id: number, userId: number, body: AttachContractDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    if (project.userId !== userId) throw new ForbiddenException('본인이 등록한 프로젝트만 컨트랙트를 연결할 수 있습니다.');
    return this.prisma.project.update({
      where: { id },
      data: {
        contractAddress: body.contractAddress,
        authSignerAddress: body.authSignerAddress,
        chainId: Number(body.chainId || 31337),
        fundingDeadline: body.fundingDeadline ? String(body.fundingDeadline) : undefined,
        votingDurationSec: body.votingDurationSec,
        quorumBps: body.quorumBps ?? 3000,
        yesThresholdBps: body.yesThresholdBps ?? 5000,
        status: 'FUNDING'
      },
      include: this.includeAll()
    });
  }

  async markEarlyClosed(id: number, userId: number) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    if (project.userId !== userId) throw new ForbiddenException('본인이 등록한 프로젝트만 조기 마감할 수 있습니다.');
    return this.prisma.project.update({ where: { id }, data: { status: 'FUNDING_CLOSED' }, include: this.includeAll() });
  }

  private includeAll() {
    return {
      milestones: { orderBy: { sortOrder: 'asc' as const } },
      pledgeOptions: { orderBy: { sortOrder: 'asc' as const } },
      posts: { orderBy: { createdAt: 'desc' as const }, include: { user: true } },
      evidences: { orderBy: { createdAt: 'desc' as const } },
      user: true
    };
  }

  private parseArray<T>(raw: string, field: string): T[] {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      throw new BadRequestException(`${field} JSON 형식이 올바르지 않습니다.`);
    }
  }
}
