const express = require('express');
const router = express.Router();
const User = require('../models/user');
const NodeCache = require( "node-cache" );
var moment = require('moment-timezone');
const myCache = new NodeCache( { stdTTL: 100, checkperiod: 120 } );

router.get('/', (req, res, next) => {
	return res.render('index.ejs');
});


router.post('/', (req, res, next) => {
	let value = myCache.get( req.body.identity );
	if (value) return res.send({status : "registered", message : "Identitas telah digunakan"})
	req.body.timeIn = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
	req.body.status = true
	myCache.set(req.body.identity, req.body, 10000 );
	return res.send({status : "ok", message : "Sukses Tambah Tamu"});
})

router.get('/guests', (req, res, next) => {
	if(req.query.id ) {
		let detailTamu = myCache.get(req.query.id);
		console.log(detailTamu)
		var now = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
		var duration = detailTamu.timeOut ? moment(detailTamu.timeOut,"YYYY-MM-DD HH:mm:ss").diff(moment(detailTamu.timeIn,"YYYY-MM-DD HH:mm:ss")) : moment(now,"YYYY-MM-DD HH:mm:ss").diff(moment(detailTamu.timeIn,"YYYY-MM-DD HH:mm:ss"))
		var d = moment.duration(duration)
		detailTamu.duration = Math.floor(d.asHours()) + moment.utc(duration).format(":mm:ss")
		return res.render('detail.ejs', {detailTamu, status : detailTamu.status});
	} else {
			let listTamuKey = myCache.keys();
			let listTamu = myCache.mget(listTamuKey);
			return res.render('data.ejs', {listTamu, status : req.query.status});
	}
})

router.get('/done', (req, res, next) => {
	if(req.query.id) {
		let tamu = myCache.get(req.query.id)
		tamu.status = false
		tamu.timeOut = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
		myCache.del(req.query.id)
		myCache.set(req.query.id, tamu, 10000 );

		let listTamuKey = myCache.keys();
		let listTamu = myCache.mget(listTamuKey);
		return res.render('data.ejs', {listTamu, status : 'active'});
	}
})


module.exports = router;