import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class ListMessagesQueryDto {
  @Transform(({ value }) => {
    if (value === undefined || value === '') {
      return undefined;
    }

    return Number(value);
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();

    return trimmed ? trimmed.toLowerCase() : undefined;
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  tag?: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();

    return trimmed || undefined;
  })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();

    return trimmed || undefined;
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();

    return trimmed || undefined;
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
