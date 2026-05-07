import { HttpException, HttpStatus } from '@nestjs/common';
import { stringConstants } from 'src/utils/string.constant';

export class ValidationException extends HttpException {
  constructor(type: ValidationExceptionType, info?: string) {
    let message;
    if (type === ValidationExceptionType.WRONG_AUTH) {
      message = stringConstants.incorrectAuth;
    }
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export enum ValidationExceptionType {
  WRONG_AUTH,
  PAYMENT_EXCEEDS_TOTAL,
  INVALID_PAYMENT_AMOUNT,
  CANNOT_RETURN_TO_VERIFICATION,
}
