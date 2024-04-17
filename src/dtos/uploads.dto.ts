import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

import { Type } from 'class-transformer';

export class FileDto {
  @IsNotEmpty({ message: 'File must not be empty' })
  public buffer: Buffer;

  @IsNotEmpty({ message: 'File original name must not be empty' })
  public originalname: string;

  @IsNotEmpty({ message: 'File MIME type must not be empty' })
  public mimetype: string;
}

export class UploadPriceListDto {
  @IsString()
  @IsNotEmpty({ message: 'Account ID must not be empty' })
  public accountId: string;

  @ValidateNested()
  @Type(() => FileDto)
  public file: FileDto;
}
