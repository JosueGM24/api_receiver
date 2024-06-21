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

const numeroToWordsEs = require('number-to-words-es');

function numeroAPalabras(numero) {
  const partes = numero.toString().split('.');
  const parteEntera = parseInt(partes[0]);
  const palabrasParteEntera = numeroToWordsEs.toWords(parteEntera);

  if (partes.length === 1) {
    return palabrasParteEntera;
  } else {
    const parteFraccionaria = partes[1];
    const palabrasParteFraccionaria = parteFraccionaria.split('').map(digit => numeroToWordsEs.toWords(parseInt(digit))).join(' ');
    return `${palabrasParteEntera} punto ${palabrasParteFraccionaria}`;
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
api.listen(api.get('port'), () => {
    console.log(`Server listening on port ${api.get('port')}`);
});