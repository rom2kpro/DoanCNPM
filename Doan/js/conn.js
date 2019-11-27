var mysql = require('mysql');

var conn = mysql.createConnection({
	database: 'mydb',
    host    : 'localhost',
    user    : 'root',
    password: ''
});
//kết nối.
conn.connect(function (err){

    if (err) throw err.stack;
    console.log('ket noi thanh cong');

});
