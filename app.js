import {DB} from './connect.js'
import express from 'express';
import bodyparser from 'body-parser';
import { Pool } from 'pg';
const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: "postgresql://postgres:Docker@123@204.168.150.70:1111/DBTradeport"
});


app.use(bodyparser.json());


app.get('/',(req, res)=>{
    res.status(200);
    res.send("Mortal services connected online");
});

app.get('/taskrequests',(req, res) =>{
    res.set('content-type','application/json');
    const sql = "SELECT * FROM TaskRequest";
    let data = {taskrequests: []};
    try {
        DB.all(sql, [], (err, rows)=>{
            if(err){
                throw err;
            }
            rows.forEach(row=>{
                data.taskrequests.push({id:row.Id, title:row.Title, tasktype:row.TaskType, description:row.Description, driversRequired:row.DriversAreRequired})
            });

            let content = JSON.stringify(data);
            res.send(content);
        });
    } catch (err) {
        console.log(err.message);
        res.status(467);
        res.send(`{"status:"${err.message}}`);
    }
});

app.get('/task-request/:id', (req, res) => {

    const { id } = req.params;

    const sql = "SELECT * FROM TaskRequest WHERE Id = ?";

    DB.get(sql, [id], (err, row) => {

        if (err) {
            console.error(err.message);
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                message: "Task request not found"
            });
        }

        const taskRequest = {
            id: row.Id,
            title: row.Title,
            taskType: row.TaskType,
            description: row.Description,
            driversRequired: row.DriversRequired,
            createdBy: row.CreatedBy
        };

        res.status(200).json({
            success: true,
            data: taskRequest
        });

    });
});

app.post('/InsertTaskRequest',(req, res) =>{
    res.set('content-type','application/json');
    const sql = "INSERT INTO TaskType(Title, TaskType, Description, DriversRequired, CreatedBy) VALUES(?, ?, ?, ?, ?)";
    let newID;
    try {
        DB.run(sql, [req.body.title, req.body.taskType, req.body.description, req.body.driversRequired, req.body.createdBy], function(err){
            if(err) throw err;

            newID= this.lastID;
            res.status(201);
            let data = {status: 201, message: `Task request ${newID} saved`};
            let content = JSON.stringify(data);
            res.send(content);
        });
    } catch (err) {
        console.log(err.message);
        res.status(468);
        res.send(`{"status:"${err.message}}`);
    }
});

app.get('/requests', (req, res) => {
    res.set('Content-Type', 'application/json');

    const sql = "SELECT * FROM TaskType";

    try {
        DB.all(sql, [], (err, rows) => {
            if (err) throw err;

            // Map DB rows to required format
            const result = rows.map(row => ({
                title: `${row.name} Job`,
                task_type: row.name,
                description: row.name,
                drivers_required: 1 // default value (since not in table)
            }));

            res.status(200).send(JSON.stringify(result));
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).send(JSON.stringify({
            error: err.message
        }));
    }
});

app.post('/InsertUser',(req, res) =>{
    res.set('content-type','application/json');
    const sql = "INSERT INTO User(Username, Email, Password, ContactNumber, Address) VALUES(?, ?, ?, ?, ?)";
    let newID;
    try {
        DB.run(sql, [req.body.username, req.body.email, req.body.password, req.body.contactNumber, req.body.address], function(err){
            if(err) throw err;

            newID= this.lastID;
            res.status(201);
            let data = {status: 201, message: `User inserted ${newID} saved`};
            let content = JSON.stringify(data);
            res.send(content);
        });
    } catch (err) {
        console.log(err.message);
        res.status(468);
        res.send(`{"status:"${err.message}}`);
    }
});

/*app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password required"
        });
    }

    const sql = "SELECT * FROM User WHERE Email = ?";

    db.get(sql, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            "SECRET_KEY",
            { expiresIn: "1h" }
        );

        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                email: user.email
            }
        });
    });
});*/

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM "User" WHERE "Email" = $1 AND "Password" = $2',
      [email, password]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});


app.delete('/api',(req, res) =>{

});

app.listen(3060, (err)=>{
    if(err){
        console.log("Error", err.message);
    }
    console.log("Listening on port 3060");
});