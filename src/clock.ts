var schedule = require('node-schedule');
var request = require("request")
const rp = require('request-promise');
import { Job} from "node-schedule"
import { Request} from "request"
const { spawn } = require('child_process');
const fs = require('fs');

export function main() {

// You should use autoenv https://github.com/inishchith/autoenv
var apikey = process.env.apiKey;
var origin = process.env.originLocation;
var destination = process.env.destination;
var url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origin}&destinations=${destination}&key=${apikey}`
var leaveTime : Date;
var myAlarm : Job;
var leaveTime : Date;
var travelTimeSeconds : number;
var timeNow: Date;
var alarmSoundedToday = false;
// 0/5 6-7 * * 1-5

var cronString;
console.log(process.env.testOrProdEnv)
switch (process.env.testOrProdEnv) {
  case "test":

      setDefaultCron()
      //cronString = '* * * * *';
      console.log("test")
    break;

  default:

    setDefaultCron()
    
    console.log("production")
    break;
}


async function setDefaultCron() {
  await fs.readFile('timeSaver.txt',{encoding: 'utf-8'}, function(err, data) {
    console.log(data)
    let newtime = data.split(":")
    leaveTime = new Date()
    leaveTime.setHours(newtime[0])
    leaveTime.setMinutes(newtime[1])

    if (newtime[1] > 40) {
      cronString = `10,20,30,40,50,55 ${newtime[0]-1}-${newtime[0]} * * 1-5`;
    } else {
      cronString = `10,20,30,40,50,55 ${newtime[0]-2}-${newtime[0]-1} * * 1-5`;
    }
    
  })
}

var scrapeJob:Job = schedule.scheduleJob(cronString, async () => {
  // check google maps
  
  await scrape()
  .then(data => {
    travelTimeSeconds = data + (30 * 60);
  });
  console.log(travelTimeSeconds);
  
  // Calculate time to leave.
  if (myAlarm) {
    myAlarm.cancel()
  }
  
  leaveTime.setSeconds(leaveTime.getSeconds() - travelTimeSeconds);
  timeNow = new Date()
  console.log(leaveTime)
  console.log(timeNow)
  console.log(leaveTime < timeNow)
  if (leaveTime < timeNow) {
    // If you would have to leave in the past immediately start alarm.
    createChildProcess()
  } else {
    // set alarm
    console.log('Setting alarm');
    myAlarm = setAlarmJob(leaveTime);  
  }
});


async function scrape(): Promise<number> {
  var request : Request
  var seconds : Promise<number>;
  var testSeconds = Promise.resolve(2400);
  switch (process.env.testOrProdEnv) {
    case "production":
        seconds = await rp(url)
        .then(response => {
          if (typeof(response) == "string") {
            response = JSON.parse(response)
          }
        
          console.log(response["rows"][0]["elements"][0]["duration"]["value"]);
          return response["rows"][0]["elements"][0]["duration"]["value"] 
        })
        .catch(err => {
          console.error(err);
        })
      break;
  
    default:
        
        seconds = testSeconds.then(response => {
          console.log(response)
          return response
        })
      break;
  }
  
  

  return seconds
}

function setAlarmJob(cron:Date) : Job {
  let alarm : Job = schedule.scheduleJob(cron,function() {
    createChildProcess()
  })
  return alarm
}

function createChildProcess() {
  if (!alarmSoundedToday) {
    const pythonProcess = spawn('python3',[__dirname + "/playSound.py"]);
      
    pythonProcess.on('close', (code) => {
      alarmSoundedToday = true;
      console.log(`child process exited with code ${code}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
  } else {
    console.log("Not playing because alarm was fired already today.")
  }
}

var resetFiredToday :Job = schedule.scheduleJob('0 5 * * *', async () => {
  alarmSoundedToday = false;
  

    setDefaultCron()
    scrapeJob.reschedule(cronString)
  });
  // set cron string for scrape
  // set cron string for "fire anyway"


var fireAnywayIfAlarmNotFired : Job = schedule.scheduleJob('50 6 * * *', async () => {
  if (alarmSoundedToday = false) {
    createChildProcess()
    alarmSoundedToday = true;
  }
})
}

if (require.main === module) {
  console.log("Main mode")
  main();
}