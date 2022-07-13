import { isEmpty, isEnum, matches, registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export default function EmptyOrDate(validationOptions?: ValidationOptions): Function {
  return (object: Object, propertyName: string): void => {
    registerDecorator({
      name: 'EmptyOrDate',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          if(isEmpty(value) || matches(value, /([0-2][0-9]|(3)[0-1])[-|\/](((0)[0-9])|((1)[0-2]))[-|\/]\d{4}$/)) {
            return true;
          }
          return false;
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must not contains duplicate entry for ${args.constraints[0]}`;
        },
      },
    });
  };
}