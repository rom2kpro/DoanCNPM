var express = require('express');
const path = require('path');
var multer = require('multer');
var mysql = require('mysql');
var app = express();
var session = require('express-session');
var port = 3000;
var pool = mysql.createPool({
	connectionLimit: 10,
	database: 'mydb',
    host    : 'localhost',
    user    : 'root',
    password: '',
    debug:true,
});

app.set("view engine", "ejs");
app.set("views", 'E:\\DoanCNPM\\DoanCNPM\\Doan' + '/view');

app.use(session({ secret :'hahaha', resave: false, saveUninitialized: true }));

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.use('/',express.static('E:\\DoanCNPM\\DoanCNPM\\Doan' + '/public'));
app.use('/',express.static('E:\\DoanCNPM\\DoanCNPM\\Doan' + '/view'));

app.listen(port, function(){
	console.log('Server listening on port ' + port);
});

var storage = multer.diskStorage({
	destination : function(req,file,cb){
		cb(null,'../public/image')
	},
	filename: function(req,file,cb){
		cb(null, file.originalname)
	}
})
var postid;
var lastid;
var userid;
var accountid;
var upload = multer({storage});

app.get('/dangky',function(req,res){
	res.render('dangky',{user: req.session.user});
})
app.post('/register',function(req,res){
	var avatar;
	sql = "INSERT INTO account(email,password) values(?,?)";
	if(req.body.gender == 'Nam'){
		avatar = "/image/Male.png";
	}else avatar = "/image/Female.png";
	pool.getConnection(function(err,conn){
		if(err) throw err;
		conn.query(sql,[req.body.email,req.body.password],function(err){
			if(err) throw err;
			console.log('thanh cong');
		})
		sql = "SELECT id FROM account WHERE email = ?";
		conn.query(sql,[req.body.email],function(err,result,field){
			accountid = result[0].id;
			sql = "INSERT INTO user(name,avatar,phone,gender,birthday,account_id) values(?,?,?,?,?,?)";
			conn.query(sql,[req.body.name,avatar,req.body.phone,req.body.gender,new Date(req.body.dob), accountid],function(err){
				conn.release();
				if(err) throw err;
				res.redirect('/dangnhap');
			});
		})
	})
})

app.get('/dangnhap',function(req,res){
	if(req.session.login){
		return res.redirect('home');
	}
	res.render('dangnhap',{user: req.session.user});
})
app.post('/dangnhap',function(req,res){
	sql = "SELECT * FROM account WHERE email = ? AND password = ?";
	var sessData = req.session;
	function dangnhap(){
		return new Promise((resolve,reject) => {
			pool.getConnection(function(err,conn){
				conn.query(sql,[req.body.email,req.body.password],function(err,result){
					if(err) return reject(err);
					console.log(result);
					// conn.release();
					if(result.length > 0){
						sessData.login = true;
					// pool.getConnection(function(err,conn){
						sql = "SELECT * FROM user WHERE account_id = ?";
						conn.query(sql,[result[0].id],function(err,result){
							if(err) return reject(err);
							conn.release();
							return resolve(result);
						})
					}

				})
			})
		})
	}
	dangnhap()
	.then((result) => sessData.user = result)
	.then(() => {
		if(sessData.login) return res.redirect('/home');
		res.redirect('dangnhap');
	})
})
app.get('/home',function(req,res){
		sql = "SELECT * FROM post"
		var kkk;

		function home(){

			return new Promise (function(resolve,reject){
				pool.getConnection(function(err,conn){
				conn.query(sql,function(err,result,field){
					conn.release();
					if (err) return reject(err);
					return resolve(result);
			})})
		})}
		home()
		.then((result) => {
			console.log(result);
			res.render('home',{
				result: result,
				user: req.session.user
		})
	})
		return
})

app.get('/upload',function(req,res){
	if(req.session.login) return res.render('dangTin',{user: req.session.user});
	res.redirect('dangnhap');
});
app.post('/upload',upload.array('files'),function(req,res){
		sql = "INSERT INTO post(title,image,price,content,created,user_id) values (?,?,?,?,?,?)";
		function themsp(){
			return new Promise((resolve, reject) => {
				pool.getConnection(function(err,conn){
					conn.query(sql,[req.body.title,'/image/'+req.files[0].filename,req.body.price,req.body.content,getTimeNow(),req.session.user[0].id],function(err,result){
						if(err) return reject(err);
						conn.release();
						return resolve(result);
					})
				})
			})
		}
		function themanh(id,name){
			sql = "INSERT INTO image(name,post_id) values (?,?)";
			return new Promise((resolve, reject) => {
				pool.getConnection(function(err,conn){
					conn.query(sql,[name,id],function(err,result){
						if(err) return reject(err);
						conn.release();
						return resolve(result);
					})
				})
			})
		}
		themsp()
		.then((result) => {for(key in req.files){
			var name = '/image/' + req.files[key].filename;
			themanh(result.insertId,name);
		}})
		.then(() => res.redirect('/home'));
})

app.get('/post/:id',function(req,res){
	var id = parseInt(req.params.id);
	sql = "SELECT * FROM post WHERE id = ?";
	function post(){
		return new Promise((resolve,reject) => {
			pool.getConnection(function(err,conn){
				conn.query(sql,[id],function(err,result){
					if(err) return reject(err);
					// conn.release();
					var a = result;
					// pool.getConnection(function(err,conn){
						sql = "SELECT * FROM image WHERE post_id = ?";
						conn.query(sql,[id],function(err,result){
							if(err) return reject(err);
							var b = result
							sql = "SELECT * FROM user WHERE id = ?";
							conn.query(sql,[a[0].user_id],function(err,result){
								conn.release();
								if(err) return reject(err);
								return resolve([a,b,result]);
							})
						})
					})
				})
			// })
			
		})
	}
	post()
	.then(([a,b,result]) => {
		req.session.user = 
		res.render('post',{
			info: a,
			image: b,
			user: req.session.user,
			userPost:result
		});
	})
	.catch((err) => {throw err})
})

app.get('/logout',function(req,res){
	req.session.destroy();
	res.redirect('/dangnhap');
})

///////////////////////////////////////////////
function getTimeNow(){
	var currentdate = new Date(); 

	var datetime = currentdate.getDate() + "/"+ (parseInt(currentdate.getMonth()) + 1) 
    	+ "/" + currentdate.getFullYear() + " @ " 
    	+ currentdate.getHours() + ":" 
    	+ currentdate.getMinutes() + ":" + currentdate.getSeconds();
    return datetime;
}