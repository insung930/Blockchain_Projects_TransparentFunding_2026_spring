import { IsEmail, IsEthereumAddress, IsOptional, IsString, Length } from 'class-validator';

export class DevLoginDto {
  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Length(1, 80)
  name: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class ConnectWalletDto {
  @IsEthereumAddress()
  walletAddress: string;
}
