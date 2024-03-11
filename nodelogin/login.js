const mariadb = require('mariadb');
const express = require('express');
const session = require('express-session');
const path = require('path');
const { log } = require('console');

const app = express();
const mysecret = 'secret888'

const pool = mariadb.createPool({
    host: 'localhost',
    port: '3307',
    user: 'root',
    password: 'Password123456',
    database: 'nodelogin',
    connectionLimit: 5
});

// Connect database
// async function asyncFunction() {
//     let conn;
//     try{
//         conn = await pool.getConnection();
//         const rows = await conn.query("");
//         console.log(rows);
//         const res = await conn.query("")
//         console.log(res);

//     } catch (err) {
//         throw err;
//     } finally {
//         if (conn) return conn.end();
//     }
// }

app.use(session({
    secret: mysecret,
    resave: false,
    saveUninitialized: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function (request, response) {
    //Render login template
    response.sendFile(path.join(__dirname + '/login.html'));
});

//http://localhost:3000/auth
app.post('/auth', async function (request, response) {
    // Cature the input fields
    let username = request.body.username;
    let password = request.body.password;
    // Ensure the input fields exists and are not emtry
    if (username && password) {
        // connect database
        let conn = await pool.getConnection().then((connection) => {
            console.log('Connected to MariaDB as id', connection.threadId);
            return connection;
        }).catch((err) => {
            console.error('Error connecting to MariaDB:', err);
        });

        try {
            // query in mariaDB
            const result = await conn.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password]);
            log(result);
            if (result.length > 0) {
                //Authenticate the user
                request.session.loggedin = true;
                request.session.username = username;
                //Redirect to home page
                response.redirect('/home');
            } else {
                response.send('Incorrect Username and/or Password!');
            }

            // query in SQL 
            // connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields){
            // if (error) throw error;
            // if (results.length>0){
            //     console.log(results);
            //     //Authenticate the user
            //     request.session.loggedin = true;
            //     request.session.username = username;
            //     //Redirect to home page
            //     response.redirect('/home');
            // } else{
            //     response.send('Incorrect Username and/or Password!');
            // }
            // response.end();
            //});

        } catch (err) {
            throw err;
        } finally {
            response.end();
            // Release the connection back to the pool when done
            if (conn) return conn.release();
        }

    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

// http://localhost:3000/home
app.get('/home', function (request, response) {
    const session = request.session;
    log(session);
    const cookie = request.cookie;
    // If the user is loggedin
    if (request.session.loggedin) {
        // Output username
        response.send('Welcome back, ' + request.session.username + '!');
    } else {
        // Not logged in
        response.send('Please login to view this page!');
    }
    response.end();
});

const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
