import { isEmpty, isEnum, matches, registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export default function BoolOrNumberOrString(validationOptions?: ValidationOptions): Function {
  return (object: Object, propertyName: string): void => {
    registerDecorator({
      name: 'BoolOrNumberOrString',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(data: any): boolean {
          if(typeof data === 'boolean' || typeof data === 'number' || typeof data === 'string') {
            return true;
          }
          return false;
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be either boolean or number type for ${args.constraints[0]}`;
        },
      },
    });
  };
}