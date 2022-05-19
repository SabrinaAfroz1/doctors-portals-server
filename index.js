const express = require('express')
const cors = require('cors');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4ez8a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('doctors_portal').collection('services');
        const bookingCollection = client.db('doctors_portal').collection('bookings');



        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);

        })



        app.get('/available', async (req, res) => {
            const date = req.query.date;
            //step-1: get all services
            const services = await serviceCollection.find().toArray();
            //step-2: get the booking of the day
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();
            //step-3: for each services, find bookings for that service

            //  manually-1. for each service
            services.forEach(service => {
                //----2. find bookings for that service
                const serviceBookings = bookings.filter(b => b.treatment === service.name);
                //----3. select slot for service bookings:         
                const booked = serviceBookings.map(s => s.slot);

                //----4.take those slot that are not in booked slots.
                const available = service.slots.filter(slot => !booked.includes(slot));
                //----5. set Available
                service.slots = available;

            });
            res.send(services);

        });




        app.post('/booking', async (req, res) => {

            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient };
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking);
            res.send({ success: true, booking: result });
        })


    } finally {

    }

}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello Doctors!')
})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})