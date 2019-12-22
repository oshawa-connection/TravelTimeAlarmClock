import express from "express"
import request from "request";
import { Request, Response, NextFunction } from "express";
const fs = require('fs');
const spawn = require("child_process").spawn;
const bodyParser = require('body-parser');
const port = 3002;
const server = express();
const hostname = "192.168.0.21"

server.use("/views",express.static(__dirname +"/../views/"));
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());
server.set('view engine', 'ejs');

server.use(function(req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS,   PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the   requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', "false");
    // Pass to next layer of middleware
    next();
  });

server.get("/",(req:Request,res:Response) => {
    console.log("get request")
    
    res
        .render(__dirname + '/../views/test123.ejs',{currentAlarmTime:"8:00"});
        //.send("hello there stranger")
})

server.post("/changeAlarmTime", async (req:Request,res:Response) => {
    console.log("posty boi")
    console.log(req.body.NewDeadline)
    if (req.body.NewDeadline !== "")  {
        await fs.writeFile('timeSaver.txt', req.body.NewDeadline.toString(), function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
        res
            .render(__dirname + '/../views/success.ejs',{newAlarmTime:req.body.NewDeadline.toString()});
    } else {
        res 
            .render(__dirname + '/../views/error.ejs')
    }
    
})

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
    //const pythonProcess = spawn('ts-node',[__dirname + "/../childProcessCode/cpxFittingCalculator.py"]);
    //notify()
    //updateDaysLeft()
  });