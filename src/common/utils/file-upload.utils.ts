import { extname } from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';
import { STATUS_CODES } from 'http';
import { v4 as uuid } from 'uuid';


// Allow only csv
export const fileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(csv)$/)) {
    return callback(
      new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Only csv files are allowed!',
          data: null,
          isError: true
        },
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }
  callback(null, true);
};

export const editfilename = (req, file, callback) => {
  const name = file.originalname.replace(/ /g,"_").split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = uuid();
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const generateName = (file) => {
  const name = file.originalname.replace(/ /g,"_").split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = uuid();
  return `${name}-${randomName}${fileExtName}`;
};