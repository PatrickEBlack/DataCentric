const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 5000; // Port that the application will run on

// Set up connection to database
const dbConfig = {
  host: 'localhost', //host which will be localhost
  user: 'root', // mysql username
  password: 'root', // mysql password
  database: 'proj2023' // database name
}; //testing commit (didnt commit first time)

const connection = mysql.createConnection(dbConfig);

connection.connect(err => {
  if (err) {
    console.error('An error occurred while connecting to the DB:', err);
    process.exit(1); // Exit process if we cannot connect to the database
  }
  console.log('Connected to Database!');
});

// Serve static files from the "public" directory
app.use(express.static('public'));

// Serve your main HTML file for the root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/main.html');
});

// Route to handle viewing store
app.get('/store', (req, res) => {
  connection.query('SELECT * FROM store', (error, results) => {
    if (error) {
      res.status(500).send('Error fetching data from the database');
      return;
    }
    let html = '<h1>Store</h1>';
    html += '<table border="1">';
    html += '<tr>';
    for (let column in results[0]) {
      html += '<th>' + column + '</th>';
    }
    html += '</tr>';
    results.forEach(row => {
      html += '<tr>';
      for (let column in row) {
        html += '<td>' + row[column] + '</td>';
      }
      html += '</tr>';
    });
    html += '</table>';
    res.send(html);
  });
});

// Route to handle viewing products
app.get('/products', (req, res) => {
    const sqlQuery = `
      SELECT p.*, ps.*
      FROM product AS p
      JOIN product_store AS ps ON p.pid = ps.pid
    `;
  
    connection.query(sqlQuery, (error, results) => {
      if (error) {
        console.error('Database query error: ', error); // Log detailed error
        res.status(500).send('Error fetching data from the database: ' + error.message);
        return;
      }
  
      // Create an HTML string to display the data in a table
      let html = '<h1>Products</h1>';
      html += '<table border="1">';
      html += '<tr>';

      // Add table headers dynamically based on the keys of the first product object
      Object.keys(results[0]).forEach(column => {
        html += '<th>' + column + '</th>';
      });
      html += '</tr>';
      
      // Add table rows for each product
      results.forEach(product => {
        html += '<tr>';
        Object.values(product).forEach(value => {
          html += '<td>' + value + '</td>';
        });
        html += '</tr>';
      });
      html += '</table>';
      
      // Send the HTML to the client
      res.send(html);
    });
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
