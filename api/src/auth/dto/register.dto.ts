import { IsEmail, IsIn, IsString } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsString()
  displayName!: string;

  @IsIn(['TEACHER', 'STUDENT'])
  role!: string;
}
