const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch(error) {
            next(error);
        }
    }
}


export default asyncHandler;






/*
'requestHandler' aik async await function hai. Is function ke defination mei error handling nahi howi hai.
Error handling ko karne ke liye hum ne 'asyncHandler' ka function banaya hai. Yeh function 'requestHandler' ko wrap karwa de ga try and catch se.
Benefit yeh hoo gaa ke jitne bhi asynchrnous functions hai unke error handling hum easily 'asyncHandler' se kar sakhte hai.

Ab kyun ke 'requestHandler' aik asynchronous function hai is liye hum is ke error handling bhi aik asynchronous function se kare gai.
*/