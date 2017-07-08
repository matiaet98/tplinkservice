/**
 * Created by matiaet98 on 27/6/2017.
 */
var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
    res.json(global.info);
});

module.exports = router;
