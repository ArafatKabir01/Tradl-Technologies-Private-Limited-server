const express = require("express");
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



//Middleware
app.use(cors());
app.use(express.json())

function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log({ auth: authHeader })
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })

}

const uri = `mongodb+srv://registration-auth:zeEsVPX37KQygVQZ@cluster1.helve.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect()
        const userCollection = client.db('UserInfo').collection('infoData');

        //   jwt token acccess
        app.post('/user/:email', (req, res) => {
            const email = req.params.email;
            console.log(req.body)
            const accessToken = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '2d'
            })
            res.send({ accessToken })
        })

        app.get('/user', verifyJwt, async (req, res) => {
            const email = req.query.email
            const query = { email: email };
            const cursor = userCollection.find(query);
            const user = await cursor.toArray();
            res.send(user)
        });

        app.post('/alluser', async (req, res) => {
            const newUser = req.body;
            const result = await userCollection.insertOne(newUser);
            res.send(result);
        });
        app.put('/user/:id', async (req, res) => {
            const id = req.params.id;
            const newData = req.body;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updateUser = {
                $set: {
                    displayName: newData.displayName,
                    phoneNumber: newData.phoneNumber,
                    place: newData.place,
                }
            };
            const result = userCollection.updateOne(filter, updateUser, option)
            res.send(result);

        })



    } finally {
        //await client.close();
        // console.log('its finally')
    }
}
run().catch(console.dir())

app.get('/', (req, res) => {
    res.send('server running')
})

app.listen(port, () => {
    console.log("listning port :", port)
})
