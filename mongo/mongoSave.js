var Patient = require('./mongoSchema').Patient;
var PatientInfo = require('./mongoSchema').PatientInfo;
var async = require('async');

//var savePatient = function (jsonObj, res) {
//    console.log(jsonObj.lastName);
//    var patientJson = jsonObj;
//    var NewPatient = new Patient({
//        lastName: patientJson.lastName,
//        mrn: patientJson.mrn
//    });
//    NewPatient.save(function (err) {
//        if (err) {
//            console.log("fail save");
//            res.send("Patient can't be saved in database - " + patientJson.lastName);
//        } else {
//            console.log('saved successfully!!');
//            res.send("Patient successfully saved - " + patientJson.lastName);
//        }
//    });
//
//};

var savePatient = function (jsonObj) {
    var patientJson = jsonObj;
    var NewPatient = new Patient({
        lastname: patientJson.lastname,
        mrn: patientJson.mrn
    });
    NewPatient.save(function (err) {
        if (err) {
            console.log("duplicate patient entry or fail save");
        } else {
            console.log('patient saved successfully!!');
        }
    });

};

var savePatientInfo = function (jsonObj, res) {
    savePatient(jsonObj.patient);
    var patientId=jsonObj.patient.mrn;
    var patientInfoJson = jsonObj.ca_data;
    if (patientInfoJson.length < 1)
        return;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var cprCount;
    async.series([
            function (callback) {
                PatientInfo.findOne({
                    date: today,
                    patientId: patientId
                }).sort('-cprCount').exec(function (err, info) {
                    if (err)
                        console.log("error in computing cpr count");
                    else if (info) {
                        cprCount = info.cprCount + 1;
                    }
                    else {
                        cprCount = 1;
                    }
                    callback(null, 'first');
                });
            },
            function (callback) {
                patientInfoJson.forEach(function (patientInfo) {
                    var NewPatientInfo = new PatientInfo({
                        date: today,
                        cprCount: cprCount,
                        patientId: patientId,
                        cpr_time: patientInfo.cpr_time,
                        cpr: patientInfo.cpr,
                        monitoring: patientInfo.monitoring,
                        intervention: patientInfo.intervention,
                        bolus: patientInfo.bolus
                    });

                    NewPatientInfo.save(function (err) {
                        if (err) {
                            console.log("fail save for cpr_time "+patientInfo.cpr_time+" for patientId : " + patientId);
                            console.log(err);
                        } else {
                            console.log("saved successfully!! " + patientId);
                        }
                    });
                });
                callback(null, 'success');
            }
        ],
        function (err, results) {
            if (results[1] === 'success') {
                //res.render('patientDetail', { data: patientInfoJson });
                res.send("Success Count "+ cprCount);
            } else
                res.send("Failed");
        }
    );


};

module.exports = {
    //savePatient: savePatient,
    savePatientInfo: savePatientInfo
};

