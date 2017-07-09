let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let information = require('../routes/information');
let reboot = require('../routes/reboot');
let net = require('net');
let fs = require('fs');
let cors = require('cors');


let config = {
    "host" : "10.0.0.1",
    "port" : "23",
    "password":"admin"
};

let match;

global.info = {
    "status": null,
    "opmode": null,
    "annex": null,
    "uptime" : null,
    "publicIp" : null,
    "downRate" : null,
    "downAttainable": null,
    "downNoiseMargin" : null,
    "downPower" : null,
    "downAttenuation" : null,
    "upRate" : null,
    "upNoiseMargin" : null,
    "upPower" : null,
    "upAttenuation" : null
}

let parseAndGetValue = (expr,data) => {
    match = RegExp(expr,"ig").exec(data);
    if(match){
        return match[1];
    }
    else{
        return null;
    }
}

const client = new net.Socket();

let conectar = () =>{
    fs.readFile(path.resolve(__dirname, 'config.json'),'utf8',(err,data)=>{
        config = JSON.parse(data);
        client.connect(config.port, config.host);
    });
}

let reiniciar = () =>{
    client.write('set reboot\n');
}

conectar();

client.on('data', data => {
    if(data.toString().indexOf('Password:') > 0){
        client.write(config.password+'\n',()=>{
            setInterval( ()=>{
                client.write('wan ad sta\n',()=>{
                    client.write('wan ad up\n',()=>{
                        client.write('wan ad opmode\n',()=>{
                            client.write('wan ad anne\n',()=>{
                                client.write('wan ad chan\n',()=>{
                                    client.write('wan ad line far\n',()=>{
                                        client.write('wan ad line near\n',()=>{
                                            client.write('wan dmt2 show rparams\n',()=>{
                                                client.write('ip if wanif0\n');
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            },1000);
        });
    }
    else{
        info.status = parseAndGetValue("current modem status: *(.*)",data) || info.status;
        info.opmode = parseAndGetValue("operational mode: *(.*)",data) || info.opmode;
        info.annex = parseAndGetValue("ADSL ANNEX\\[HW\\] : *(.*)",data) || info.annex;
        info.uptime = parseAndGetValue("ADSL uptime *(.*)",data) || info.uptime;
        info.publicIp = parseAndGetValue("inet *(.*), netmask",data) || info.publicIp;
        info.downRate = parseAndGetValue("near-end interleaved channel bit rate: *(.*)",data) || info.downRate;
        info.downAttainable = parseAndGetValue("ATTNDRds    = *(.*)",data) || info.downAttainable;
        info.downNoiseMargin = parseAndGetValue("noise margin downstream: *(.*)",data) || info.downNoiseMargin;
        info.downPower = parseAndGetValue("output power upstream: *(.*)",data) || info.downAttenuation;
        info.downAttenuation = parseAndGetValue("attenuation downstream: *(.*)",data) || info.downAttenuation;
        info.upRate = parseAndGetValue("far-end interleaved channel bit rate: *(.*)",data) || info.upRate;
        info.upNoiseMargin = parseAndGetValue("noise margin upstream: *(.*)",data) || info.upNoiseMargin;
        info.upPower = parseAndGetValue("output power downstream: *(.*)",data) || info.upPower;
        info.upAttenuation = parseAndGetValue("attenuation upstream: *(.*)",data) || info.upAttenuation;
    }
});


client.on('close', function() {
    conectar();
});

var app = express();
console.log('starting');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', (req,res,next)=>{
    var err = new Error();
    err.code = 500;
    err.message = 'Inaccesible';
    next();
});

app.use('/tplink/information', information);
//app.use('/tplink/reboot', reboot);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);
});

module.exports = app;