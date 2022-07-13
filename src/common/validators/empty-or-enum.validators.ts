import { isEmpty, isEnum, registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export default function EmptyOrEnum(property: any, validationOptions?: ValidationOptions): Function {
  return (object: Object, propertyName: string): void => {
    registerDecorator({
      name: 'EmptyOrEnum',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          if(isEmpty(value) || isEnum(value, property)) {
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