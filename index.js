const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors({
    origin: [
        // 'http://localhost:5173',
        'https://cars-doctor-17a15.web.app',
        'https://cars-doctor-17a15.firebaseapp.com'

    ],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dd29rey.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//own created middlewares

const logger = (req, res, next) => {
    console.log('log: info', req.method, req.url);
    next();
}

// verify token by middleware
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    console.log('token in the middleware', token);

    // no token available
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const serviceCollection = client.db('carDoctor').collection('services');
        const bookingCollection = client.db('carDoctor').collection('bookings');

        // Auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign( user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })   // user logout korle cookies theke token ti remove korte
        })


        // Services related api
        app.get('/services', async (req, res) => {
            const filter = req.query;
            console.log(filter);

            const query = {
                // price : {$lt: 150, $gt:50}
                title:{$regex: filter.search,$options:'i'}
            };
            const options = {
                sort: {
                    price: filter.sort === 'asc'? 1 : -1
                }
            }

            // const cursor = serviceCollection.find();    //for find all
            // const result = await cursor.toArray();
            const result = await serviceCollection.find(query,options).toArray(); // uporer dui line ekline ao kora jai
            res.send(result);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, price: 1, service_id: 1, img: 1 },     // jei jei property gulo chai tar man 1 dite hobe na chaile 0 dite hobe
            };
            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        })

        // Bookings

        app.get('/bookings', verifyToken, async (req, res) => {
            // console.log('Cookies', req.cookies);
            console.log('token owner info', req.user);
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbiddeen access' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }    // database er email abong client er email match korabe 
            }
            const result = await bookingCollection.find(query).toArray();
            // console.log(result);
            res.send(result);
        })

        app.post("/bookings", async (req, res) => {
            const bookings = req.body;
            console.log(bookings);
            const result = await bookingCollection.insertOne(bookings);
            res.send(result);
        });

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBookings = req.body;
            const updateDoc = {
                $set: {
                    status: updatedBookings.status
                },
            };
            // console.log(updatedBookings);
            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send("doctor server is running");
})

app.listen(port, () => {
    console.log(`car doctor server is running on port ${port}`);
})
