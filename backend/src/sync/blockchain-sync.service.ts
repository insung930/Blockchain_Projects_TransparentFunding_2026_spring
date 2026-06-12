import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Contract, JsonRpcProvider, formatEther } from 'ethers';
import { PrismaService } from '../prisma.service';
import { FUNDING_ABI } from '../contracts/abi';

@Injectable()
export class BlockchainSyncService {
  private readonly logger = new Logger(BlockchainSyncService.name);
  private readonly provider = new JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545', Number(process.env.CHAIN_ID || 31337));
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async syncAll() {
    const projects = await this.prisma.project.findMany({ where: { contractAddress: { not: null } }, include: { milestones: true } });
    for (const project of projects) {
      try { await this.syncProject(project.id); } catch (error: any) { this.logger.warn(`sync failed project=${project.id} ${error?.message || error}`); }
    }
  }

  async syncProject(projectId: number) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, include: { milestones: { orderBy: { sortOrder: 'asc' } } } });
    if (!project?.contractAddress) return null;
    const contract = new Contract(project.contractAddress, FUNDING_ABI, this.provider);
    const [totalFunded, currentMilestone, fundingDeadline, rawMilestones] = await Promise.all([contract.totalFunded(), contract.currentMilestone(), contract.fundingDeadline(), contract.getMilestones()]);
    const now = Math.floor(Date.now() / 1000);
    const goalReached = Number(formatEther(totalFunded)) >= Number(project.goalEth);
    const status = Number(currentMilestone) >= project.milestones.length ? 'COMPLETED' : goalReached ? 'MILESTONE' : now > Number(fundingDeadline) ? 'FAILED' : 'FUNDING';
    await this.prisma.project.update({ where: { id: projectId }, data: { totalFundedEth: formatEther(totalFunded), currentMilestone: Number(currentMilestone), fundingDeadline: String(fundingDeadline), status, lastSyncedAt: new Date() } });
    for (let i = 0; i < rawMilestones.length; i++) {
      const local = project.milestones[i];
      if (!local) continue;
      const m = rawMilestones[i];
      await this.prisma.milestone.update({ where: { id: local.id }, data: { evidenceSubmitted: Boolean(m.evidenceSubmitted ?? m[1]), evidenceUri: String(m.evidenceURI ?? m[2] ?? ''),
voteStart: String(m.voteStart ?? m[3] ?? ''),
voteEnd: String(m.voteEnd ?? m[4] ?? ''), yesVotesEth: formatEther(m.yesVotes ?? m[5]), noVotesEth: formatEther(m.noVotes ?? m[6]), released: Boolean(m.released ?? m[7]) } });
    }
  }
}
