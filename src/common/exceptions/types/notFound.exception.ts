import { HttpException, HttpStatus } from '@nestjs/common';
import { stringConstants } from 'src/utils/string.constant';

export class NotFoundCustomException extends HttpException {
  constructor(type: NotFoundCustomExceptionType) {
    let message;
    switch (type) {
      case NotFoundCustomExceptionType.USER:
        message = stringConstants.userNotFound;
        break;
      case NotFoundCustomExceptionType.BRAND:
        message = stringConstants.brandNotFound;
        break;
      case NotFoundCustomExceptionType.CATEGORY:
        message = stringConstants.categoryNotFound;
        break;
      case NotFoundCustomExceptionType.BILL:
        message = stringConstants.billingInfoNotFound;
        break;
      case NotFoundCustomExceptionType.SHIPPING_ADDRESS:
        message = stringConstants.shippingAddressNotFound;
        break;
      case NotFoundCustomExceptionType.ORDER:
        message = stringConstants.orderNotFound;
        break;
      case NotFoundCustomExceptionType.PRODUCT:
        message = stringConstants.productNotFound;
        break;
      case NotFoundCustomExceptionType.SPARE_PART:
        message = stringConstants.sparePartNotFound;
        break;
      case NotFoundCustomExceptionType.MEDIA:
        message = stringConstants.mediaNotFound;
        break;
      case NotFoundCustomExceptionType.LANDING:
        message = stringConstants.landingNotFound;
        break;
      case NotFoundCustomExceptionType.BRAND_CATEGORY:
        message = stringConstants.brandCategoryNotFound;
        break;
      default:
        message = stringConstants.notFound;
    }
    super(message, HttpStatus.NOT_FOUND);
  }
}

export enum NotFoundCustomExceptionType {
  USER,
  BRAND,
  CATEGORY,
  BRAND_CATEGORY,
  BILL,
  SHIPPING_ADDRESS, 
  ORDER,
  PRODUCT,
  SPARE_PART,
  MEDIA,
  LANDING,
  PRODUCT_SPARE_PART
}
