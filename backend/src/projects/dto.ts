import { IsEthereumAddress, IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  @Length(2, 80)
  title: string;

  @IsString()
  @Length(10, 5000)
  description: string;

  @IsEthereumAddress()
  creatorAddress: string;

  @IsString()
  @IsNotEmpty()
  goalEth: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  chainId?: number;

  @IsString()
  milestones: string;

  @IsString()
  pledgeOptions: string;
}

export class AttachContractDto {
  @IsEthereumAddress()
  contractAddress: string;

  @IsOptional()
  @IsEthereumAddress()
  authSignerAddress?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  chainId?: number;

  @IsOptional()
  @IsString()
  fundingDeadline?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  votingDurationSec?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  quorumBps?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  yesThresholdBps?: number;
}
