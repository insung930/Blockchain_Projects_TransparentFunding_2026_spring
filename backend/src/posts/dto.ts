import { IsString, Length } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @Length(1, 1000)
  content: string;
}

export class UpdatePostDto {
  @IsString()
  @Length(1, 1000)
  content: string;
}
