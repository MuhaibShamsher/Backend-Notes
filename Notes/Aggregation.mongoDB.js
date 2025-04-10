/*
Aggregation is like a data processing pipeline, where each stage modifies the data and passes it to the next step.
MongoDB Aggregation Stages: $lookup, $project, $match, $sort, $group
MongoDB Aggregation Operators: $sum, $size, $first, $pull, $push, $min, $max, $avg, $gt, $gte
aggregate() aik array return karta hai
Understand the output, whether it is an array with single objecy or multiple objects

Stage               Purpose	                          Example
$match      Filters data (like find())	        Get users from "Lahore"
$group      Groups data (like SQL GROUP BY)	    Count users per city
$sort	    Sorts the results	                Sort users by age
$project	Selects specific fields	            Show only name and age
$lookup	    Joins another collection	        Get orders of each user
$unwind
$addFields
*/


// collections
users = [
    { "_id": 1, "name": "Ali", "age": 22, "city": "Lahore" },
    { "_id": 2, "name": "Sara", "age": 28, "city": "Karachi" },
    { "_id": 3, "name": "Ahmed", "age": 25, "city": "Lahore" }
]

orders = [
    { "orderId": 101, "userId": 1, "item": "Laptop" },
    { "orderId": 102, "userId": 2, "item": "Phone" },
    { "orderId": 103, "userId": 1, "item": "Mouse" }
]


// ....................................................... $match ........................................................
// Filter only users from Lahore
db.users.aggregate([
    {
        $match: {
            city: "Lahore"
        }
    }
]);

Output = [
    { "_id": 1, "name": "Ali", "age": 22, "city": "Lahore" },
    { "_id": 3, "name": "Ahmed", "age": 25, "city": "Lahore" }
]


// ........................................................ $group .......................................................
// count how many users are in each city
db.users.aggregate([
    {
        $group: {
            _id: "$city",
            totalUsers: { $sum: 1 }
        }
    }
]);

output = [
    { "_id": "Lahore", "totalUsers": 2 },
    { "_id": "Karachi", "totalUsers": 1 }
]


// calculate average age of users in each city
db.users.aggregate([
    {
        $group: {
            _id: "$city",
            avgAge: { $avg: "$age" }
        }
    }
]);

output = [
    { "_id": "Lahore", "avgAge": 23.5 },
    { "_id": "Karachi", "avgAge": 28 }
]

/*
$lookup jitne doucments hoo gai utne documents he return kare gaa.
Agr aik single document mei result chahiye tou $group ka use karo

when you are paginating, avoid using $group
B\c we don’t need to group them under one object, this structure is harder to work when paginating.
*/

// ......................................................... $sort ......................................................
// sort users by age from oldest to youngest
db.users.aggregate([
    {
        $sort: {
            age: -1 // -1 Sorts in descending order and 1 Sorts in ascending order
        }
    }
]);

output = [
    { "_id": 2, "name": "Sara", "age": 28, "city": "Karachi" },
    { "_id": 3, "name": "Ahmed", "age": 25, "city": "Lahore" },
    { "_id": 1, "name": "Ali", "age": 22, "city": "Lahore" }
]


// ....................................................... $project ........................................................
// select only name and age, and hide _id
db.users.aggregate([
    {
        $project: {
            _id: 0,
            name: 1,
            age: 1
        }
    }
]);

output = [
    { "name": "Ali", "age": 22 },
    { "name": "Sara", "age": 28 },
    { "name": "Ahmed", "age": 25 }
]


/*
if we are using $project we need to select field on the basis of either 0 or 1
we cannot use both 0 and 1 at the same time for excluding and including fields except _id
*/


// .......................................................... $lookup .....................................................
//  get all orders for each user 
db.users.aggregate([
    {
        // the local field belongs from the users schema and foregin field belongs from the orders schema
        $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "userId",
            as: "userOrders"
        }
    }
]);

output = [
    {
        "_id": 1,
        "name": "Ali",
        "age": 22,
        "city": "Lahore",
        "userOrders": [
            { "orderId": 101, "userId": 1, "item": "Laptop" },
            { "orderId": 103, "userId": 1, "item": "Mouse" }
        ]
    },
    {
        "_id": 2,
        "name": "Sara",
        "age": 28,
        "city": "Karachi",
        "userOrders": [
            { "orderId": 102, "userId": 2, "item": "Phone" }
        ]
    }
]


// ........................................................................................................................
db.users.aggregate([
    // Stage 1: Filter users from Lahore
    {
        $match: {
            city: "Lahore"
        }
    },

    // Stage 2: Sort by age (descending)
    {
        $sort: {
            age: -1
        }
    }
]);

output = [
    { "_id": 3, "name": "Ahmed", "age": 25, "city": "Lahore" },
    { "_id": 1, "name": "Ali", "age": 22, "city": "Lahore" }
]


// .................................................... Multiple Stages ..........................................................
users = {
    "_id": ObjectId("65123456789abcdef0123456"),
    "name": "John Doe",
    "age": 25,
    "city": "New York",
    "salary": 5000,
    "hobbies": ["reading", "gaming"],
    "role": "developer"
}

/*
We want to:
Filter users who are older than 20.
Sort them by salary in descending order.
Project only the name, age, and salary fields.
Group users by role and calculate the average salary for each role.
*/

db.users.aggregate([
    {
        $match: {
            age: {
                $gt: 20
            }
        }
    },

    {
        $sort: {
            salary: -1
        }
    },

    {
        $project: {
            _id: 0,
            name: 1,
            age: 1,
            salary: 1
        }
    },

    {
        $group: {
            _id: "$role",
            avgSalary: {
                $avg: "$salary"
            },
            totalUsers: {
                $sum: 1
            }
        }
    }
])


// .................................................... Nested Pipeline ..........................................................

// The $lookup fetches all fields of the users collection (e.g. userName, password, email, refreshToken, etc.).
// After retrieving all data, $project removes the unwanted fields.
Video.aggregate([
    {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
        }
    },
    {
        $project: {
            userName: 1,
            fullName: 1,
            avatar: 1
        }
    }
])


// The pipeline inside $lookup will filters the Data Before Returning
// The $lookup only fetches the required fields (userName, fullName, avatar) from the users collection.
// The pipeline should be inside the $lookup. Use of nested pipeline at the same stage but outside the $lookup will throws an error.
Video.aggregate([
    {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",

            pipeline: [
                {
                    $project: {
                        userName: 1,
                        fullName: 1,
                        avatar: 1
                    }
                }
            ]
        }
    },
])


// ......................................................... $unwind ..............................................................
const orders = [
    {
        "_id": 1,
        "customer": "Alice",
        "items": ["Laptop", "Mouse", "Keyboard"]
    },
    {
        "_id": 2,
        "customer": "Bob",
        "items": ["Monitor", "Printer"]
    }
]

// creating multiple documents, one for each array element.
db.orders.aggregate([
    { 
        $unwind: "$items" 
    }
]);

[
    { "_id": 1, "customer": "Alice", "items": "Laptop" },
    { "_id": 1, "customer": "Alice", "items": "Mouse" },
    { "_id": 1, "customer": "Alice", "items": "Keyboard" },
    { "_id": 2, "customer": "Bob", "items": "Monitor" },
    { "_id": 2, "customer": "Bob", "items": "Printer" }
]

/*
$lookup return the array of all matching documents. If we want to include each document in a specific parent document we $unwind it
we mostly used $unwind when we have the one-to-one relationship between two tables.
one-to-one relationship -> means the $lookup always returns an array with the sinlge object
If we used $unwind but there is not any relationship between tables then the parent document will be deleted.
to avoid this probelm we can use $unwind like this
$unwind: {
    path: "$owner",
    preserveNullAndEmptyArrays: true
}
*/

/*
$lookup returns an array of all matching documents from the joined collection.

When we have a "one-to-one relationship" (e.g., a comment has only one owner), 
$lookup still returns an array, but usually with a single object.

To flatten this array and include the joined document directly into the parent document, we use **$unwind**.

If there is "no matching document" in the joined collection, using $unwind without any options will cause the parent document to be removed from the result.

To avoid this issue, use:
$unwind: {
    path: "$owner",
    preserveNullAndEmptyArrays: true
}
This keeps the parent document in the results even when the join yields no match.
*/

