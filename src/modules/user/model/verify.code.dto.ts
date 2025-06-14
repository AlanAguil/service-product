import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyCodeDTO {
  @ApiProperty({ description: 'User ID' })
  @IsNotEmpty()
  id: bigint;

  @ApiProperty({ description: 'Verification code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  @IsNotEmpty()
  password: string;
} 