const mysql = require('mysql');
const express = require("express");
const cors = require('cors');
const dgram = require('dgram');
const api = express();
const bodyParser = require('body-parser');
//Configuraciones
api.set('port', process.env.PORT || 3000);
api.use(cors({origin:'*'}));
api.use(bodyParser.json());
const numberToWords = require('number-to-words');

//index
api.get('/', function(peticion, respuesta)
{
    respuesta.json({mensaje: "API corriendo correctamente"});
});

function numeroAPalabras(numero) {
    const partes = numero.toString().split('.');
    const parteEntera = parseInt(partes[0]);
    const palabrasParteEntera = numberToWords.toWords(parteEntera);
  
    if (partes.length === 1) {
      return palabrasParteEntera;
    } else {
      const parteFraccionaria = partes[1];
      const palabrasParteFraccionaria = parteFraccionaria.split('').map(digit => numberToWords.toWords(parseInt(digit))).join(' ');
      return `${palabrasParteEntera} point ${palabrasParteFraccionaria}`;
    }
  }

function evaluarOperacion(operacion) {
    try {
        const resultado = eval(operacion);
        return resultado;
    } catch (e) {
        return e.toString();
    }
}

function decimalAHexadecimalConFraccion(numeroDecimal) {
    if (typeof numeroDecimal !== 'number') {
        return "El parámetro debe ser un número decimal.";
    }

    const parteEntera = Math.floor(numeroDecimal);
    const parteEnteraHex = parteEntera.toString(16);

    if (Number.isInteger(numeroDecimal)) {
        return parteEnteraHex;
    }

    let parteFraccionaria = numeroDecimal - parteEntera;
    let parteFraccionariaHex = [];
    while (parteFraccionaria > 0) {
        parteFraccionaria *= 16;
        const digitoHex = Math.floor(parteFraccionaria);
        parteFraccionariaHex.push(digitoHex.toString(16));
        parteFraccionaria -= digitoHex;

        if (parteFraccionariaHex.length > 10) {
            break;
        }
    }

    const resultadoHex = `${parteEnteraHex}.${parteFraccionariaHex.join('')}`;
    return resultadoHex;
}
api.get('/getInHex', function(peticion, respuesta)
{
    let expression = peticion.query.expression;
    respuesta.json({
        result: decimalAHexadecimalConFraccion(evaluarOperacion(expression))
    })
});
api.post('/send', (req, res) => {
    const { operation, multicast_groups, ports } = req.body;
    const client = dgram.createSocket('udp4');

    let results = [];

    multicast_groups.forEach(group => {
        ports.forEach(port => {
            const message = Buffer.from(operation);
            client.send(message, 0, message.length, port, group, (err) => {
                if (err) {
                    results.push(`Error al enviar a ${group}:${port} - ${err.message}`);
                } else {
                    results.push(`Enviado a ${group}:${port}`);
                }
            });
        });
    });

    setTimeout(() => {
        client.close();
        res.json(results);
    }, 1000);
});
api.get('/getInText', function(peticion, respuesta)
{
    let expression = peticion.query.expression;
    respuesta.json({
        result: numeroAPalabras(evaluarOperacion(expression))
    })
});
api.get('/products', function(peticion, respuesta)
{
    let conn = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "store"
    });
    conn.query(`SELECT * FROM PRODUCTS`
    , function(err, resultados, fields)
    {
        if (err) throw err;
        respuesta.json({resultados: resultados})
    });
});

api.get('/sales', function(peticion, respuesta)
{
    let conn = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "store"
    });
    conn.query(`SELECT * FROM SALES`
    , function(err, resultados, fields)
    {
        if (err) throw err;
        respuesta.json({resultados: resultados})
    });
});
api.get('/customers', function(peticion, respuesta)
{
    let conn = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "store"
    });
    conn.query(`SELECT * FROM CUSTOMERS`
    , function(err, resultados, fields)
    {
        if (err) throw err;
        respuesta.json({resultados: resultados})
    });
});

api.post('/products/insert', function(peticion, respuesta)
{
    let name_product = peticion.body.name_product;
    let price_product = parseFloat(peticion.body.price_product);
    let conn = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "store"
    });
    conn.query("INSERT INTO products values(null, '"
        + name_product + "',"
        + price_product + ")", function(err, resultados, fields)
    {
    if (err){
        respuesta.json({
            status: "FAILED",
            message: "Error insertion"});
        throw err;
    } else {
        respuesta.json({
            status: "OK",
            message: "Successful insertion"});
    }
    });
});

api.post('/customers/insert', function(peticion, respuesta)
{
    let name_customer = peticion.body.name_customer;
    let addr_state_customer = peticion.body.addr_state_customer;
    let conn = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "store"
    });
    conn.query("INSERT INTO customers values(null, '"
        + name_customer + "','"
        + addr_state_customer + "')", function(err, resultados, fields)
    {
    if (err){
        respuesta.json({
            status: "FAILED",
            message: "Error insertion"});
        throw err;
    } else {
        respuesta.json({
            status: "OK",
            message: "Successful insertion"});
    }
    });
});

api.post('/sales/insert', function(peticion, respuesta)
{
    let id_product = parseInt(peticion.body.id_product);
    let id_customer = parseInt(peticion.body.id_customer);
    let date_sale = peticion.body.date_sale;
    let conn = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "store"
    });
    conn.query("INSERT INTO sales values(null, "
        + id_product + ","
        + id_customer + ",'"
        + date_sale + "')", function(err, resultados, fields)
    {
    if (err){
        respuesta.json({
            status: "FAILED",
            message: "Error insertion"});
        throw err;
    } else {
        respuesta.json({
            status: "OK",
            message: "Successful insertion"});
    }
    });
});

api.listen(api.get('port'), () => {
    console.log(`Server listening on port ${api.get('port')}`);
});