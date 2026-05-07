import { HttpException, HttpStatus } from '@nestjs/common';
import { stringConstants } from 'src/utils/string.constant';

export class NotFoundCustomException extends HttpException {
  constructor(type: NotFoundCustomExceptionType) {
    let message;
    switch (type) {
      case NotFoundCustomExceptionType.AUTH:
        message = stringConstants.authNotFound;
        break;
      case NotFoundCustomExceptionType.MEDIA:
        message = stringConstants.mediaNotFound;
        break;
      case NotFoundCustomExceptionType.USER:
        message = stringConstants.userNotFound;
        break;
      case NotFoundCustomExceptionType.APPOINTMENT:
        message = stringConstants.appointmentNotFound;
        break;
      default:
        message = stringConstants.resourceNotFound;
    }

    super(message, HttpStatus.NOT_FOUND);
  }
}

export enum NotFoundCustomExceptionType {
  AUTH = 'AUTH',
  MEDIA = 'MEDIA',
  USER = 'USER',
  APPOINTMENT = 'APPOINTMENT',
}
