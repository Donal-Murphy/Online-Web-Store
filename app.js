//Import Dependencies
const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const calculate = require('./calculate');


//Create Express.js app
const app = express();

//Configure Express server
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const path = require("path")

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

//Specify view engine for dynamic content
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// other imports
const publicDir = path.join(__dirname,'./public')
app.use(express.static(publicDir))

// Configure session middleware
app.use(session({
	secret: 'placeholder-secret-key',
  resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

//Connect to the mySQL database
const db = mysql.createConnection({
    host: 'localhost',
   	user: 'root',
    password: 'root',
    database: 'G00438847'
});

//Check connection to database
db.connect((err) => {
    if (err) {
        console.error('Error connectiong to the database: ',err);
    }else {
        console.log('Connected to the database!');
    }
});

app.get("/test", (req, res) =>{
	res.render("test.html")
});

//Provide static home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'home', 'index.html'));
});

// Serve static files from the "images" directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// Endpoint to serve a random image URL
app.get('/random-image-carousel', (req, res) => {
	//Array containing all filenames for carousel
	const imageFilenames = ['carousel_image1.jpg','carousel_image2.jpg','carousel_image3.jpg','carousel_image4.jpg',
							'carousel_image5.jpg','carousel_image6.jpg','carousel_image7.jpg','carousel_image8.jpg',
							'carousel_image9.jpg','carousel_image10.jpg','carousel_image11.jpg','carousel_image12.jpg']; 
    // Generate a random index to select a random image URL from the array
    const randomIndex = Math.floor(Math.random() * imageFilenames.length);
    const randomImage = imageFilenames[randomIndex];
	
	const imagePath = path.join(__dirname, 'images', randomImage);

    // Respond with JSON data containing the random image URL
    res.sendFile(imagePath);
});

let cartGlobal = [];

// Define a route to render the login page
app.get('/loginForm', (req, res) => {
    res.render('loginForm', {message: ''});
});

//Authenticate login
app.post("/loginAuth", function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    db.query("SELECT * FROM login WHERE Username = ? AND Password = ?;", [username,password], function (err, results, fields) {
        console.log("Query results:", results); // Check the results

        if (err){
            console.error("Error executing database query:", err);
            return res.render("loginForm", {message: 'Error Logging in'});
        } else if (results.length === 1){
            res.redirect('/cartTotal');
        } else if (results.length === 0){
            return res.render("loginForm", {message: 'Invalid Login'});
        } else {
            return res.render("loginForm", {message: 'Unknown Error'});
        }
    });
});

app.get('/store', (req, res) => {
  // Query to retrieve all data from a specific table
  const query = 'SELECT * FROM productData';

  // Execute the query
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    
    // Render the webpage using EJS template
    res.render('store', { items: results });
  });
});

app.post('/addToCart', (req, res) => {
    const cartData = req.body.cart; // Access cart data from request body
    console.log(cartData);

    // Clear the cart array
    cartGlobal = [];

    // Add the new cart data to cartGlobal, spreading the input array
    cartGlobal.push(...cartData);

    // Render the login form page
    res.render('loginForm', { message: '' }, (err, html) => {
        if (err) {
			console.log('Error detected')
            console.error('Error rendering loginForm:', err);
            // You can choose how to handle rendering errors, such as sending an error response
            return res.status(500).send('Error rendering loginForm');
        }
        // Send the rendered HTML
        res.send(html);
    });
});

app.post('/submit-cart', (req, res) => {
    const { cart } = req.body;
    console.log('Received cart:', cart);
    // Process the cart data as needed, for example, save it to a database
    res.json({ message: 'Cart received successfully', cart });
});

app.get('/cartTotal', (req, res) => {
	console.log(cartGlobal);
    // Query MySQL database to fetch corresponding items by item IDs
    db.query('SELECT itemId, itemName, price FROM productdata WHERE itemId IN (?)', [cartGlobal], (err, results) => {
        if (err) {
            console.error('Error executing MySQL query: ', err);
            res.status(500).send('Error retrieving data from database');
            return;
        }
		if (results.length === 0){
			console.log('No matches found')
			return;
		}
		console.log('match found');
        // Combine results with cart data
	    const combinedData = cartGlobal.map(itemId => {
	              const match = results.find(result => result.itemId === itemId); // Use strict equality
	              if (match) {
	                  return { itemId, ...match };
	              } else {
	                  console.warn(`No match found for itemId: ${itemId}`);
	                  return { itemId };
	              }
        });
		console.log(combinedData);
        // Use custom module to calculate total price
        const totalPrice = calculate.calculateTotalPrice(combinedData);

        res.render('cartSummary', { cart: combinedData, totalPrice });
    });
});
/
app.listen(3000, ()=> {
    console.log("server started on port 3000")
})