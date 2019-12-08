var schedule = require('node-schedule');
var request = require("request")
const rp = require('request-promise');
import { Job} from "node-schedule"
import { Request} from "request"
const { spawn } = require('child_process');
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
var scrapeJob:Job = schedule.scheduleJob('5,10,15,20,25,30,35,40,45 6-7 * * 1-5', async () => {
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
  
  leaveTime = new Date()
  leaveTime.setHours(8)
  leaveTime.setMinutes(0)
  
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
  var seconds  = await rp(url)
  .then(response => {
    
    console.log(response["rows"][0]["elements"][0]["duration"]["value"])
    return response["rows"][0]["elements"][0]["duration"]["value"] 
  })
  .catch(err => {
    console.error(err);
  })
  // var testSeconds = Promise.resolve(2400);
  // var seconds  = testSeconds.then(response => {
  //   console.log(response)
  //   return response
  // })

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
})

var fireAnywayIfAlarmNotFired : Job = schedule.scheduleJob('50 6 * * *', async () => {
  if (alarmSoundedToday = false) {
    createChildProcess()
    alarmSoundedToday = true;
  }
})