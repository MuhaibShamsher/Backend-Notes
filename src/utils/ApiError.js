class ApiError extends Error {
    constructor(statusCode, message="Something went wrong", errors=null, stack="") {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.data = null;
        this.errors = errors;

        if(stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}


export default ApiError;




// super(message) => The super call the constructor of the parent class. In this case, Error constructor with message
// The super() should be used before 'this' keyword
// this.message = message => not need to use this line in child construcot as it is already used in parent class, super(message)