import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthorizePledgeDto } from './dto';
import { Wallet, getBytes, parseEther, solidityPackedKeccak256 } from 'ethers';
import { randomBytes } from 'crypto';

@Injectable()
export class PledgesService {
  constructor(private readonly prisma: PrismaService) {}

  async authorize(projectId: number, userId: number, body: AuthorizePledgeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('회원 정보를 찾을 수 없습니다.');

    const walletAddress = body.walletAddress.toLowerCase();
    if (user.walletAddress && user.walletAddress.toLowerCase() !== walletAddress) {
      throw new BadRequestException('로그인 회원에 연결된 지갑과 현재 지갑이 다릅니다.');
    }
    if (!user.walletAddress) {
      await this.prisma.user.update({ where: { id: userId }, data: { walletAddress } });
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { pledgeOptions: { orderBy: { sortOrder: 'asc' } } }
    });
    if (!project?.contractAddress) throw new BadRequestException('컨트랙트가 연결되지 않은 프로젝트입니다.');
    const option = project.pledgeOptions[body.optionIndex];
    if (!option) throw new BadRequestException('존재하지 않는 후원 옵션입니다.');

    const amountWei = parseEther(option.amountEth);
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const nonce = `0x${randomBytes(32).toString('hex')}`;
    const chainId = project.chainId || Number(process.env.CHAIN_ID || 31337);
    const digest = solidityPackedKeccak256(
      ['address', 'uint256', 'address', 'uint256', 'uint256', 'uint256', 'bytes32'],
      [project.contractAddress, chainId, walletAddress, body.optionIndex, amountWei, deadline, nonce]
    );
    const signer = new Wallet(process.env.AUTH_SIGNER_PRIVATE_KEY || '0x8b3a350cf5c34c9194ca3a545d03bb755eedc292b4d697b91c4f9e8fced97e2a');
    const signature = await signer.signMessage(getBytes(digest));

    return {
      contractAddress: project.contractAddress,
      optionIndex: body.optionIndex,
      member: walletAddress,
      amountEth: option.amountEth,
      amountWei: amountWei.toString(),
      deadline,
      nonce,
      signature,
      authSigner: signer.address
    };
  }
}
