const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 5000; // Port that the application will run on
const bodyParser = require('body-parser'); // Was getting errors before adding this

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

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
    const query = 'SELECT * FROM store'; // Adjust the query if needed

    connection.query(query, (error, results) => {
        if (error) {
            res.status(500).send('Error fetching store: ' + error.message);
            return;
        }

        let html = `
        <h1>Store</h1>
        <a href="/add-store">Add Store</a>
        <table border="1">
          <tr>
            <th>SID</th>
            <th>Location</th>
            <th>Manager ID</th>
            <th>Action</th>
          </tr>`;

        results.forEach(store => {
            html += `
          <tr>
            <td>${store.sid}</td>
            <td>${store.location}</td>
            <td>${store.mgrid}</td>
            <td><a href="/store/edit/${store.sid}">Update</a></td>
          </tr>`;
        });

        html += `</table><a href="/">Home</a>`;

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
        html += '<th>Product Id</th>';
        html += '<th>Description</th>';
        html += '<th>Supplier</th>';
        html += '<th>Store ID</th>';
        html += '<th>Price</th>';
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

app.get('/store/edit/:sid', (req, res) => {
    const sid = req.params.sid;
  
    // Fetch store data from the database
    const query = 'SELECT * FROM store WHERE sid = ?';
    connection.query(query, [sid], (error, results) => {
      if (error) {
        res.status(500).send('Error fetching store: ' + error.message);
        return;
      }
  
      if (results.length === 0) {
        res.status(404).send('Store not found');
        return;
      }
  
      const store = results[0]; // Assuming we have one result
  
      // Generate the HTML for the edit form, pre-populated with the store's data
      let html = `
        <h1>Edit Store</h1>
        <form action="/store/update/${store.sid}" method="post">
          <label for="sid">SID</label>
          <input type="text" id="sid" name="sid" value="${store.sid}" readonly><br>
          <label for="location">Location</label>
          <input type="text" id="location" name="location" value="${store.location}" required minlength="1"><br>
          <label for="managerId">Manager ID</label>
          <input type="text" id="managerId" name="managerId" value="${store.mgrid}" required pattern=".{4}"><br>
          <button type="submit">Update</button>
        </form>
        <a href="/store">Home</a>
      `;
  
      res.send(html);
    });
});

app.post('/store/update/:sid', (req, res) => {
    const { sid } = req.params; // The store ID being updated (This cannot be changed)
    const { location, managerId } = req.body; // New data from the form (Both location and manager Id can be changed)

    // Check if the managerId is already assigned to a different store
    const checkManagerQuery = 'SELECT * FROM store WHERE mgrid = ? AND sid != ?';

    connection.query(checkManagerQuery, [managerId, sid], (error, results) => {
        if (error) {
            res.status(500).send('Error checking manager ID: ' + error.message);
            return;
        }

        if (results.length > 0 && results.length <8) {
            // Manager ID is already assigned to another store
            let html = `
                <h1>Edit Store</h1>
                <p>Manager: ${managerId} already managing another store</p>
                <form action="/store/update/${sid}" method="post">
                    <label for="sid">SID</label>
                    <input type="text" id="sid" name="sid" value="${sid}" readonly><br>
                    <label for="location">Location</label>
                    <input type="text" id="location" name="location" value="${location}" required minlength="1"><br>
                    <label for="managerId">Manager ID</label>
                    <input type="text" id="managerId" name="managerId" value="${managerId}" required pattern=".{4}"><br>
                    <button type="submit">Update</button>
                </form>
                <a href="/store">Home</a>
            `;
            res.send(html); // Send the form back with an error message
        } else {
            // If managerId is not assigned elsewhere, proceed to update the store
            const updateQuery = 'UPDATE store SET location = ?, mgrid = ? WHERE sid = ?';
            connection.query(updateQuery, [location, managerId, sid], (updateError, updateResults) => {
                if (updateError) {
                    res.status(500).send('Error updating store: ' + updateError.message);
                    return;
                }

                // After successful update, redirect to the store list
                res.redirect('/store');
            });
        }
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
