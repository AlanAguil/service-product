import { Controller, Get, Post, Put, Body, Param, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './model/create.user.dto';
import { UpdateUserDto } from './model/update.user.dto';
import { ResetPasswordDTO } from './model/reset.password.dto';
import { ResetPasswordCodeDTO } from './model/reset.password.code.dto';
import { VerifyCodeDTO } from './model/verify.code.dto';
import { UpdateProfileDto } from './model/update-profile.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  async findAll() {
    return await this.userService.findAll();
  }

  @Get('/active')
  @ApiOperation({ summary: 'Get all active users' })
  @ApiResponse({ status: 200, description: 'List of active users retrieved successfully' })
  async findAllActive() {
    return await this.userService.findAllActive();
  }

  @Get('/:userId')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'Return user by id' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('userId') userId: string) {
    return await this.userService.findById(BigInt(userId));
  }

  @Get('/phoneNumber/:phoneNumber')
  @ApiOperation({ summary: 'Get user information by phone number for call service' })
  @ApiParam({ name: 'phoneNumber', type: 'string', description: 'User phone number' })
  @ApiResponse({ status: 200, description: 'User information retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserInfo(@Param('phoneNumber') phoneNumber: string) {
    return await this.userService.getUserInfo(phoneNumber);
  }

  @Get('/email/:email')
  @ApiOperation({ summary: 'Get user by email' })
  @ApiResponse({ status: 200, description: 'Return user by email' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByEmail(@Param('email') email: string) {
    return await this.userService.findByEmail(email);
  }

  @Delete('/delete/:id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: bigint) {
    return await this.userService.delete(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Post('/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.userService.register(createUserDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(updateUserDto);
  }

  @Post('/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDTO) {
    return await this.userService.resetPassword(resetPasswordDto);
  }

  @Post('/send-code-email/:userId')
  @ApiOperation({ summary: 'Send reset code to user email' })
  @ApiResponse({ status: 200, description: 'Code sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendCodeEmail(@Param('userId') userId: string) {
    return await this.userService.sendCodeEmail(BigInt(userId));
  }

  @Post('/reset-password-with-code')
  @ApiOperation({ summary: 'Reset password using verification code' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPasswordWithCode(@Body() resetPasswordCodeDto: ResetPasswordCodeDTO) {
    return await this.userService.resetPasswordWithCode(resetPasswordCodeDto);
  }

  @Post('/send-verification-code')
  @ApiOperation({ summary: 'Send a verification code via WhatsApp' })
  @ApiBody({ schema: { example: { id: 1 } } })
  @ApiResponse({ status: 200, description: 'Code sent via WhatsApp' })
  async sendVerificationCode(@Body('id') id: bigint) {
    return await this.userService.sendVerificationCode(id);
  }

  @Post('/verify-code')
  @ApiOperation({ summary: 'Verify code and change password' })
  @ApiBody({ type: VerifyCodeDTO })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  async verifyCodeAndSetPassword(@Body() verifyCodeDTO: VerifyCodeDTO) {
    return await this.userService.verifyCodeAndSetPassword(verifyCodeDTO);
  }

  @Put('/update-profile/:id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(@Param('id') id: bigint, @Body() updateProfileDto: UpdateProfileDto) {
    return await this.userService.updateProfile(id, updateProfileDto);
  }

  @Get('/stats/customers')
  @ApiOperation({ summary: 'Get customer statistics' })
  @ApiResponse({ status: 200, description: 'Customer statistics retrieved successfully' })
  async getCustomerStats() {
    return await this.userService.getCustomerStats();
  }
}
