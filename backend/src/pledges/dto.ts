import { IsEthereumAddress, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AuthorizePledgeDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  optionIndex: number;

  @IsEthereumAddress()
  walletAddress: string;
}
