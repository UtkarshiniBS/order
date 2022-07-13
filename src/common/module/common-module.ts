import { Repository, InsertResult, UpdateResult, DeleteResult } from "typeorm";

export abstract class CommonModule {
    static validateNumber(value: string | number): boolean {
        return ((value != null) &&
            (value !== '') &&
            !isNaN(Number(value.toString())));
    }

    static FormatDeleteResponse(statusCode: any, response: DeleteResult): any {
        return {
            statusCode: statusCode,
            error: null,
            data: response.affected > 0 ? true : false,
            isError: false
        };
        // return (response.affected > 0 ? true : false);
    }

    static FormatErrorResponse(statusCode: any, error: any, response: DeleteResult): any {
        return {
            statusCode: statusCode,
            error: error,
            data: response,
            isError: true
        };
        // return (response.affected > 0 ? true : false);
    }

    static FormatUpdateResponse(statusCode: any, response: UpdateResult) {
        return {
            statusCode: statusCode,
            error: null,
            data: response.affected > 0 ? true : false,
            isError: false
        };
        //return (response.affected > 0 ? true : false);
    }

    static FormatCreateResponse(statusCode: any, request: InsertResult, columnName: string) {
        let response = false;
        if (request && request.identifiers && request.identifiers.length > 0 && request.identifiers[0][columnName]) {
            response = true;
        }
        return {
            statusCode: statusCode,
            error: null,
            data: response,
            isError: false
        };
        // return response;
    }
    static FormatCreateResponseReturnId(statusCode: any, request: InsertResult, columnName: string) {
        let response = 0;
        if (request && request.identifiers && request.identifiers.length > 0 && request.identifiers[0][columnName]) {
            response = request.identifiers[0][columnName];
        }
        return {
            statusCode: statusCode,
            error: null,
            data: response,
            isError: false
        };
        // return response;
    }
    static FormatResponse(statusCode: any, message: string, data: any): any {
        return {
            statusCode: statusCode,
            error: null,
            message: message ? message : null,
            data: data ? data : null,
            isError: false
        }; 
        // return (data ? data : null);
    }
    static isValidEmail(mailId: string): boolean {
        const filter = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!filter.test(mailId)) {
            return false;
        } else {
            return true;
        }
    }

    static LowerCaseConversion(input: string) {
        let output = "";
        if (input) {
            output = input.trim().toLowerCase();
        }
        return output;
    }

    static formatDate(input) {
        if (input) {
            return new Date(input.replace(/(\d{2})-(\d{2})-(\d{4})/, "$2/$1/$3"));
        } 
        return null;
    }
}